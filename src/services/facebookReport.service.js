const axios = require("axios");

// ======================================================
// CONFIG
// ======================================================

const API_VERSION = process.env.META_API_VERSION || "v26.0";
const GRAPH_API = `https://graph.facebook.com/${API_VERSION}`;
const PAGE_ID = process.env.META_PAGE_ID;
const ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;

// Used to decide which calendar day / weekday a post belongs to.
// 330 = India (UTC+5:30). Override with REPORT_TZ_OFFSET_MINUTES if needed.
const TZ_OFFSET_MINUTES = Number(process.env.REPORT_TZ_OFFSET_MINUTES ?? 330);

// How many posts we fetch insights for at the same time (be nice to the API)
const INSIGHT_CONCURRENCY = 5;

/*
 * Meta retired the old "impressions" / "unique impressions" metrics
 * (post_impressions, post_impressions_unique ...). Their replacements are:
 *   reach  -> post_total_media_view_unique
 *   views  -> post_media_view
 * Each metric is requested on its own, so one unsupported metric never
 * breaks the whole report - it simply shows as "N/A" in the PDF.
 */
const POST_METRICS = {
    reach: "post_total_media_view_unique",
    views: "post_media_view",
    clicks: "post_clicks",
};

const PAGE_METRICS = {
    totalFollowers: "page_follows",
    newFollowers: "page_daily_follows",
    unfollows: "page_daily_unfollows_unique",
    pageVisits: "page_views_total",
};

const POST_FIELDS = [
    "id",
    "created_time",
    "message",
    "story",
    "permalink_url",
    "status_type",
    "attachments{media_type,type,subattachments}",
    "reactions.limit(0).summary(true)",
    "comments.limit(0).summary(true)",
    "shares",
].join(",");

const FORMAT_LABEL = {
    IMAGE: "Image",
    VIDEO: "Video",
    CAROUSEL: "Carousel",
    LINK: "Link",
    TEXT: "Text",
};

const WEEKDAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

// ======================================================
// SMALL HELPERS
// ======================================================

const round = (value, digits = 2) => Number(Number(value).toFixed(digits));

const sum = (values) =>
    values.reduce((total, value) => total + (Number(value) || 0), 0);

const average = (values) => (values.length ? sum(values) / values.length : 0);

// Sum that returns null when EVERY value is null (metric unavailable)
const sumNullable = (values) => {
    if (!values.length) return 0;

    const available = values.filter(
        (value) => value !== null && value !== undefined
    );

    return available.length ? sum(available) : null;
};

const fmt = (value) => Number(value || 0).toLocaleString("en-IN");

const errorMessage = (error) =>
    error?.response?.data?.error?.message || error?.message || "Unknown error";

const createNotes = () => ({ unavailable: new Set() });

const markUnavailable = (notes, metric, error) => {
    notes.unavailable.add(metric);
    console.warn(
        `[FB Report] Metric "${metric}" unavailable: ${errorMessage(error)}`
    );
};

// Runs fn over items with limited parallelism, keeping the original order
const mapLimit = async (items, limit, fn) => {
    const results = new Array(items.length);
    let cursor = 0;

    const workers = Array.from(
        { length: Math.min(limit, items.length) },
        async () => {
            while (cursor < items.length) {
                const index = cursor++;
                results[index] = await fn(items[index], index);
            }
        }
    );

    await Promise.all(workers);

    return results;
};

// ======================================================
// DATE HELPERS
// ======================================================

const parseDate = (date) => {
    const value = new Date(`${date}T00:00:00Z`);

    if (Number.isNaN(value.getTime())) {
        throw new Error(`Invalid date: ${date}`);
    }

    return value;
};

const formatDate = (date) => date.toISOString().split("T")[0];

const addDays = (date, days) => {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
};

const daysBetween = (fromDate, toDate) =>
    Math.floor(
        (parseDate(toDate).getTime() - parseDate(fromDate).getTime()) /
            (1000 * 60 * 60 * 24)
    ) + 1;

const longDate = (iso) => {
    const d = parseDate(iso);
    const month = d.toLocaleDateString("en-US", {
        month: "short",
        timeZone: "UTC",
    });

    return `${String(d.getUTCDate()).padStart(2, "0")} ${month} ${d.getUTCFullYear()}`;
};

const toLocalParts = (iso) => {
    const shifted = new Date(new Date(iso).getTime() + TZ_OFFSET_MINUTES * 60000);

    return {
        date: shifted.toISOString().slice(0, 10),
        weekday: WEEKDAYS[shifted.getUTCDay()],
    };
};

// ======================================================
// COMPARISON PERIOD
// ======================================================

const getComparisonPeriod = ({
    fromDate,
    toDate,
    compareType,
    compareFromDate,
    compareToDate,
}) => {
    const from = parseDate(fromDate);

    if (compareType === "custom") {
        if (!compareFromDate || !compareToDate) {
            throw new Error("Custom comparison dates are required");
        }

        return { from: compareFromDate, to: compareToDate };
    }

    if (compareType === "previous_month") {
        const year = from.getUTCFullYear();
        const month = from.getUTCMonth();

        return {
            from: formatDate(new Date(Date.UTC(year, month - 1, 1))),
            to: formatDate(new Date(Date.UTC(year, month, 0))),
        };
    }

    // previous_period: same number of days, immediately before "from"
    const length = daysBetween(fromDate, toDate);
    const previousTo = addDays(from, -1);
    const previousFrom = addDays(previousTo, -(length - 1));

    return { from: formatDate(previousFrom), to: formatDate(previousTo) };
};

// ======================================================
// FACEBOOK API CALLS
// ======================================================

const getPostsByDateRange = async (fromDate, toDate) => {
    try {
        const until = formatDate(addDays(parseDate(toDate), 1));

        const response = await axios.get(`${GRAPH_API}/${PAGE_ID}/posts`, {
            params: {
                fields: POST_FIELDS,
                since: fromDate,
                until,
                limit: 100,
                access_token: ACCESS_TOKEN,
            },
        });

        let posts = response.data?.data || [];
        let nextUrl = response.data?.paging?.next;

        while (nextUrl) {
            const next = await axios.get(nextUrl);
            posts = posts.concat(next.data?.data || []);
            nextUrl = next.data?.paging?.next;
        }

        return posts;
    } catch (error) {
        console.error("Facebook Posts API Error:", errorMessage(error));
        throw error;
    }
};

// Lifetime value of ONE metric for ONE post (null when unavailable)
const fetchPostMetric = async (postId, metric, notes) => {
    try {
        const response = await axios.get(`${GRAPH_API}/${postId}/insights`, {
            params: { metric, access_token: ACCESS_TOKEN },
        });
console.log("(response.data)"+JSON.stringify(response.data))
        const value = response.data?.data?.[0]?.values?.[0]?.value;

        return typeof value === "number" ? value : null;
    } catch (error) {
        markUnavailable(notes, metric, error);
        return null;
    }
};

// Daily values of each page metric for the period
const getPageSeries = async (fromDate, toDate, notes) => {
    const until = formatDate(addDays(parseDate(toDate), 1));

    const entries = await Promise.all(
        Object.values(PAGE_METRICS).map(async (metric) => {
            try {
                const response = await axios.get(
                    `${GRAPH_API}/${PAGE_ID}/insights`,
                    {
                        params: {
                            metric,
                            period: "day",
                            since: fromDate,
                            until,
                            access_token: ACCESS_TOKEN,
                        },
                    }
                );

                return [metric, response.data?.data?.[0]?.values || []];
            } catch (error) {
                markUnavailable(notes, metric, error);
                return [metric, null];
            }
        })
    );

    return Object.fromEntries(entries);
};

const getPageDetails = async () => {
    try {
        const response = await axios.get(`${GRAPH_API}/${PAGE_ID}`, {
            params: {
                fields: "id,name,followers_count",
                access_token: ACCESS_TOKEN,
            },
        });

        return response.data || {};
    } catch (error) {
        console.error("Facebook Page Details Error:", errorMessage(error));
        return {};
    }
};

// ======================================================
// POST ENRICHMENT
// ======================================================

const detectFormat = (post) => {
    const attachment = post.attachments?.data?.[0];
    const type = String(attachment?.media_type || attachment?.type || "").toLowerCase();

    if (attachment?.subattachments?.data?.length > 1 || type === "album") {
        return "CAROUSEL";
    }
    if (type.includes("video")) return "VIDEO";
    if (type.includes("photo")) return "IMAGE";
    if (type.includes("link") || type.includes("share")) return "LINK";

    return "TEXT";
};

const makeTitle = (post) => {
    const raw = String(post.message || post.story || "")
        .replace(/\s+/g, " ")
        .trim();

    if (!raw) return "Untitled post";

    return raw.length > 45 ? `${raw.slice(0, 42)}...` : raw;
};

const enrichPost = async (raw, notes) => {
    const [reach, views, clicks] = await Promise.all([
        fetchPostMetric(raw.id, POST_METRICS.reach, notes),
        fetchPostMetric(raw.id, POST_METRICS.views, notes),
        fetchPostMetric(raw.id, POST_METRICS.clicks, notes),
    ]);

    const reactions = Number(raw.reactions?.summary?.total_count || 0);
    const comments = Number(raw.comments?.summary?.total_count || 0);
    const shares = Number(raw.shares?.count || 0);

    // Engagement = Reactions + Comments + Shares + Link Clicks
    const engagement = reactions + comments + shares + (clicks || 0);

    const local = toLocalParts(raw.created_time);

    return {
        id: raw.id,
        title: makeTitle(raw),
        format: detectFormat(raw),
        createdTime: raw.created_time,
        date: local.date,
        weekday: local.weekday,
        permalink: raw.permalink_url || null,
        reach,
        views,
        reactions,
        comments,
        shares,
        clicks,
        engagement,
        engagementRate: reach ? round((engagement / reach) * 100) : null,
    };
};

// ======================================================
// PERIOD TOTALS
// ======================================================

const sumSeries = (values) => {
    if (!values || !values.length) return null;
    return sum(values.map((item) => item.value));
};

const lastSeries = (values) => {
    if (!values || !values.length) return null;
    const value = values[values.length - 1]?.value;
    return typeof value === "number" ? value : null;
};

const computeTotals = (posts, series, page, toDate) => {
    const reach = sumNullable(posts.map((p) => p.reach));
    const views = sumNullable(posts.map((p) => p.views));
    const clicks = sumNullable(posts.map((p) => p.clicks));
    const reactions = sum(posts.map((p) => p.reactions));
    const comments = sum(posts.map((p) => p.comments));
    const shares = sum(posts.map((p) => p.shares));
    const engagement = sum(posts.map((p) => p.engagement));

    // Followers at the END of the period. The Page API only gives today's
    // count, so for past periods we rely on the page_follows insight.
    let followers = lastSeries(series[PAGE_METRICS.totalFollowers]);
    const today = formatDate(new Date());

    if (followers === null && toDate >= today && page.followers_count) {
        followers = Number(page.followers_count);
    }

    const newFollowers = sumSeries(series[PAGE_METRICS.newFollowers]);
    const unfollows = sumSeries(series[PAGE_METRICS.unfollows]);

    return {
        postsCount: posts.length,
        reach,
        views,
        reactions,
        comments,
        shares,
        clicks,
        engagement,
        engagementRate: reach ? round((engagement / reach) * 100) : null,
        avgReach: reach !== null && posts.length ? Math.round(reach / posts.length) : null,
        avgEngagement: posts.length ? Math.round(engagement / posts.length) : 0,
        followers,
        newFollowers,
        unfollows,
        netFollowers:
            newFollowers !== null && unfollows !== null
                ? newFollowers - unfollows
                : newFollowers,
        pageVisits: sumSeries(series[PAGE_METRICS.pageVisits]),
    };
};

const buildPeriod = async (fromDate, toDate, notes) => {
    const [rawPosts, series, page] = await Promise.all([
        getPostsByDateRange(fromDate, toDate),
        getPageSeries(fromDate, toDate, notes),
        getPageDetails(),
    ]);

    const sorted = [...rawPosts].sort(
        (a, b) => new Date(a.created_time) - new Date(b.created_time)
    );

    const enriched = await mapLimit(sorted, INSIGHT_CONCURRENCY, (post) =>
        enrichPost(post, notes)
    );

    const posts = enriched.map((post, i) => ({ ...post, index: i + 1 }));

    return {
        posts,
        page,
        totals: computeTotals(posts, series, page, toDate),
    };
};

// ======================================================
// GROWTH
// ======================================================

const percentChange = (current, previous) => {
    if (current === null || current === undefined) return null;
    if (previous === null || previous === undefined) return null;

    if (previous === 0) return current === 0 ? 0 : null; // "new" - no % possible

    return round(((current - previous) / previous) * 100, 1);
};

const GROWTH_KEYS = [
    "postsCount",
    "reach",
    "views",
    "reactions",
    "comments",
    "shares",
    "clicks",
    "engagement",
    "avgEngagement",
    "followers",
    "newFollowers",
    "netFollowers",
    "pageVisits",
];

const calculateGrowth = (current, previous) => {
    const growth = {};

    GROWTH_KEYS.forEach((key) => {
        growth[key] = percentChange(current[key], previous[key]);
    });

    // Engagement rate is already a percentage -> difference in percentage points
    growth.engagementRate =
        current.engagementRate !== null && previous.engagementRate !== null
            ? round(current.engagementRate - previous.engagementRate, 2)
            : null;

    return growth;
};

// ======================================================
// ANALYSIS
// ======================================================

const buildFormatAnalysis = (posts) => {
    const groups = {};

    posts.forEach((post) => {
        (groups[post.format] = groups[post.format] || []).push(post);
    });

    return Object.entries(groups)
        .map(([format, list]) => {
            const withReach = list.filter((p) => p.reach);
            const reachSum = sum(withReach.map((p) => p.reach));
            const engagementSum = sum(withReach.map((p) => p.engagement));
            const viewValues = list.map((p) => p.views).filter((v) => v !== null);

            return {
                format,
                label: FORMAT_LABEL[format] || format,
                count: list.length,
                avgReach: withReach.length ? Math.round(reachSum / withReach.length) : null,
                avgViews: viewValues.length ? Math.round(average(viewValues)) : null,
                avgEngagement: Math.round(sum(list.map((p) => p.engagement)) / list.length),
                engagementRate: reachSum ? round((engagementSum / reachSum) * 100) : null,
            };
        })
        .sort((a, b) => b.count - a.count);
};

const pickBy = (posts, key, direction) => {
    const candidates = posts.filter((p) => p[key] !== null && p[key] !== undefined);

    if (!candidates.length) return null;

    return candidates.reduce((best, post) =>
        direction === "max"
            ? post[key] > best[key] ? post : best
            : post[key] < best[key] ? post : best
    );
};

const buildHighlights = (posts) => ({
    topReach: pickBy(posts, "reach", "max"),
    topEngagement: pickBy(posts, "engagement", "max"),
    topRate: pickBy(posts, "engagementRate", "max"),
    topShares: pickBy(posts, "shares", "max"),
    topClicks: pickBy(posts, "clicks", "max"),
    lowestReach: posts.length > 1 ? pickBy(posts, "reach", "min") : null,
});

const pearson = (xs, ys) => {
    if (xs.length < 3) return null;

    const mx = average(xs);
    const my = average(ys);
    let num = 0;
    let dx = 0;
    let dy = 0;

    xs.forEach((x, i) => {
        num += (x - mx) * (ys[i] - my);
        dx += (x - mx) ** 2;
        dy += (ys[i] - my) ** 2;
    });

    const den = Math.sqrt(dx * dy);

    return den ? round(num / den) : null;
};

const bestWeekday = (posts) => {
    if (posts.length < 5) return null;

    const groups = {};

    posts.forEach((post) => {
        (groups[post.weekday] = groups[post.weekday] || []).push(post.engagement);
    });

    const days = Object.entries(groups).map(([day, values]) => ({
        day,
        avg: Math.round(average(values)),
        count: values.length,
    }));

    if (days.length < 2) return null;

    return days.sort((a, b) => b.avg - a.avg)[0];
};

const strongestAndWeakestFormat = (formats) => {
    const ranked = formats
        .filter((f) => f.engagementRate !== null)
        .sort((a, b) => b.engagementRate - a.engagementRate);

    if (ranked.length < 2) return null;

    return { best: ranked[0], worst: ranked[ranked.length - 1] };
};

const buildInsights = ({ current, previous, growth, posts, formats, highlights }) => {
    if (!posts.length) {
        return [
            {
                title: "No posts published",
                detail: "No organic posts were published during the selected period, so there is no post-level performance to analyse.",
            },
        ];
    }

    const out = [];
    const { topEngagement, topClicks, lowestReach } = highlights;

    if (topEngagement) {
        out.push({
            title: "Top performing post",
            detail: `Post ${topEngagement.index} ("${topEngagement.title}") generated ${fmt(topEngagement.engagement)} interactions${
                topEngagement.reach ? ` from ${fmt(topEngagement.reach)} people reached` : ""
            }, the highest of the period.`,
        });
    }

    if (growth.reach !== null) {
        const up = growth.reach >= 0;

        out.push({
            title: up ? "Reach is growing" : "Reach declined",
            detail: `Total post reach ${up ? "increased" : "decreased"} by ${Math.abs(growth.reach)}% compared with the previous period (${fmt(previous.reach)} to ${fmt(current.reach)}).`,
        });
    }

    if (growth.engagement !== null) {
        const up = growth.engagement >= 0;

        out.push({
            title: up ? "Engagement is rising" : "Engagement fell",
            detail: `Total engagement ${up ? "rose" : "dropped"} by ${Math.abs(growth.engagement)}% versus the previous period (${fmt(previous.engagement)} to ${fmt(current.engagement)}).`,
        });
    }

    const formatPair = strongestAndWeakestFormat(formats);

    if (formatPair) {
        out.push({
            title: "Format effectiveness",
            detail: `${formatPair.best.label} posts had the highest engagement rate (${formatPair.best.engagementRate}%), while ${formatPair.worst.label} posts had the lowest (${formatPair.worst.engagementRate}%).`,
        });
    }

    if (current.clicks > 0 && topClicks && topClicks.clicks) {
        const share = round((topClicks.clicks / current.clicks) * 100, 1);

        out.push({
            title: "Link click driver",
            detail: `Post ${topClicks.index} ("${topClicks.title}") drove ${share}% (${fmt(topClicks.clicks)}) of all ${fmt(current.clicks)} link clicks.`,
        });
    }

    if (
        lowestReach &&
        current.avgReach &&
        lowestReach.reach < current.avgReach * 0.5
    ) {
        out.push({
            title: "Underperforming post",
            detail: `Post ${lowestReach.index} ("${lowestReach.title}") reached ${fmt(lowestReach.reach)} people - less than half of the average post (${fmt(current.avgReach)}).`,
        });
    }

    return out.slice(0, 6);
};

const buildRecommendations = ({ current, previous, growth, posts, formats, highlights, days }) => {
    if (!posts.length) {
        return [
            {
                title: "Restart a posting schedule",
                detail: "Publish at least 3 posts per week so the page has enough data to analyse next period.",
            },
        ];
    }

    const out = [];
    const formatPair = strongestAndWeakestFormat(formats);
    const postsPerWeek = round(current.postsCount / (days / 7), 1);

    if (formatPair) {
        out.push({
            title: `Publish more ${formatPair.best.label.toLowerCase()} content`,
            detail: `${formatPair.best.label} posts earned a ${formatPair.best.engagementRate}% engagement rate versus ${formatPair.worst.engagementRate}% for ${formatPair.worst.label.toLowerCase()} posts. Shift more of the content plan towards the stronger format.`,
        });
    }

    if (highlights.topEngagement) {
        out.push({
            title: "Repeat what worked best",
            detail: `Build follow-up content around the theme of Post ${highlights.topEngagement.index} ("${highlights.topEngagement.title}"), which earned the most interactions.`,
        });
    }

    if (postsPerWeek < 3) {
        out.push({
            title: "Post more consistently",
            detail: `The page averaged ${postsPerWeek} posts per week. Aim for at least 3 per week to keep the audience engaged and the algorithm active.`,
        });
    } else if (growth.postsCount !== null && growth.postsCount < 0 && growth.engagement !== null && growth.engagement < 0) {
        out.push({
            title: "Restore posting frequency",
            detail: `Publishing volume and engagement both fell versus the previous period. Return to the earlier posting rhythm.`,
        });
    }

    if (current.clicks !== null && current.engagement > 0) {
        const clickShare = (current.clicks / current.engagement) * 100;

        if (clickShare < 15) {
            out.push({
                title: "Strengthen calls-to-action",
                detail: `Only ${round(clickShare, 1)}% of interactions were link clicks. Add clearer CTAs (e.g. "Shop now", "Get the offer") and place links earlier in the post.`,
            });
        }
    }

    if (
        highlights.lowestReach &&
        current.avgReach &&
        highlights.lowestReach.reach < current.avgReach * 0.5
    ) {
        out.push({
            title: "Review low-reach posts",
            detail: `Post ${highlights.lowestReach.index} reached far fewer people than average. Test a different posting time, a stronger visual or a shorter caption.`,
        });
    }

    const day = bestWeekday(posts);

    if (day) {
        out.push({
            title: `Test posting on ${day.day}s`,
            detail: `Posts published on ${day.day} averaged ${fmt(day.avg)} interactions, the highest of any day (based on ${day.count} post${day.count > 1 ? "s" : ""}). Repeat and confirm before committing.`,
        });
    }

    if (out.length < 3) {
        out.push({
            title: "Keep tracking month by month",
            detail: "Compare each period against the previous one to spot which formats and topics consistently perform best.",
        });
    }

    return out.slice(0, 5);
};

const buildTakeaways = ({ current, posts, formats, highlights }) => {
    const t = {};

    if (!posts.length) return t;

    const { topReach, lowestReach, topEngagement } = highlights;

    if (topReach && lowestReach && topReach.id !== lowestReach.id) {
        t.reach = `Post ${topReach.index} (${topReach.title}) achieved the highest reach (${fmt(topReach.reach)} people), while Post ${lowestReach.index} (${lowestReach.title}) had the lowest (${fmt(lowestReach.reach)}).`;
    } else if (topReach) {
        t.reach = `Post ${topReach.index} (${topReach.title}) reached ${fmt(topReach.reach)} people.`;
    }

    if (topEngagement && current.engagement > 0) {
        const reactionShare = round((current.reactions / current.engagement) * 100, 1);

        t.engagement = `Post ${topEngagement.index} generated the highest number of interactions (${fmt(topEngagement.engagement)}). Reactions make up ${reactionShare}% of all interactions on the page.`;
    }

    const byReach = [...formats]
        .filter((f) => f.avgReach !== null)
        .sort((a, b) => b.avgReach - a.avgReach);
    const byRate = [...formats]
        .filter((f) => f.engagementRate !== null)
        .sort((a, b) => b.engagementRate - a.engagementRate);

    if (byReach.length && byRate.length) {
        t.contentType =
            byReach[0].format === byRate[0].format
                ? `${byReach[0].label} posts led on both average reach (${fmt(byReach[0].avgReach)}) and engagement rate (${byRate[0].engagementRate}%).`
                : `${byReach[0].label} posts achieved the highest average reach (${fmt(byReach[0].avgReach)}), while ${byRate[0].label} posts were the most efficient at turning reach into engagement (${byRate[0].engagementRate}%).`;
    }

    const paired = posts.filter((p) => p.reach !== null);
    const r = pearson(
        paired.map((p) => p.reach),
        paired.map((p) => p.engagement)
    );

    if (r !== null) {
        const strength = Math.abs(r) >= 0.7 ? "strong" : Math.abs(r) >= 0.4 ? "moderate" : "weak";

        t.relationship = `Reach and engagement show a ${strength} ${r >= 0 ? "positive" : "negative"} relationship (correlation ${r}). Posts in the top-right of the chart combine wide reach with strong interaction.`;
    }

    if (posts.length >= 4 && topEngagement) {
        const half = Math.floor(posts.length / 2);
        const first = average(posts.slice(0, half).map((p) => p.engagement));
        const second = average(posts.slice(posts.length - half).map((p) => p.engagement));
        const change = first ? round(((second - first) / first) * 100, 1) : null;

        t.trend = `Engagement peaked around ${longDate(topEngagement.date)} (Post ${topEngagement.index}).${
            change !== null
                ? ` Average engagement per post in the later part of the period was ${Math.abs(change)}% ${change >= 0 ? "higher" : "lower"} than in the earlier part.`
                : ""
        }`;
    }

    return t;
};

const buildSummary = ({ pageName, period, current, growth, highlights, posts }) => {
    const label = `${longDate(period.from)} - ${longDate(period.to)}`;

    if (!posts.length) {
        return `No organic posts were published by ${pageName} between ${label}.`;
    }

    let text = `Between ${label}, ${pageName} published ${current.postsCount} organic Facebook post${current.postsCount > 1 ? "s" : ""}`;

    if (current.reach !== null) text += `, reaching ${fmt(current.reach)} people in total (sum of per-post reach)`;
    if (current.views !== null) text += ` and generating ${fmt(current.views)} views`;

    text += `. The page recorded ${fmt(current.engagement)} interactions`;

    if (current.engagementRate !== null) text += `, an average engagement rate of ${current.engagementRate}%`;

    text += ".";

    if (growth.engagement !== null) {
        text += ` Engagement ${growth.engagement >= 0 ? "grew" : "declined"} ${Math.abs(growth.engagement)}% compared with the previous period.`;
    }

    if (highlights.topEngagement) {
        text += ` Post ${highlights.topEngagement.index} ("${highlights.topEngagement.title}") was the strongest performer. Applying the recommendations in this report should help sustain growth in reach and engagement.`;
    }

    return text;
};

const buildDataNotes = (notes) => {
    const list = [];

    if (notes.unavailable.size) {
        list.push({
            title: "Some metrics were not available",
            detail: `Meta did not return data for: ${[...notes.unavailable].join(", ")}. These values are shown as N/A and are excluded from totals where relevant.`,
        });
    }

    list.push(
        {
            title: "Organic activity only",
            detail: "Figures represent organic post activity. Boosted posts and paid campaign results are reported separately.",
        },
        {
            title: "How reach is totalled",
            detail: "Total reach is the sum of each post's unique reach. A person who saw several posts is counted once per post, so this total can be higher than the number of distinct people reached.",
        },
        {
            title: "Views replace impressions",
            detail: "Meta has replaced the older 'impressions' metrics with 'views' (times content was displayed). This report uses Meta's current views metric.",
        },
        {
            title: "Calculation method",
            detail: "Total Engagement = Reactions + Comments + Shares + Link Clicks. Engagement Rate = Total Engagement / Reach x 100. All totals are calculated from the individual post records shown in this report.",
        },
        {
            title: "API scope",
            detail: "Deleted, archived or age-restricted posts may not appear in Meta's API data, and Meta metrics can be revised for several days after posting.",
        }
    );

    return list;
};

// ======================================================
// GENERATE REPORT
// ======================================================

const generatePostReport = async ({
    fromDate,
    toDate,
    compareType = "previous_period",
    compareFromDate,
    compareToDate,
}) => {
    parseDate(fromDate);
    parseDate(toDate);

    if (fromDate > toDate) {
        throw new Error("fromDate must be on or before toDate");
    }

    const comparison = getComparisonPeriod({
        fromDate,
        toDate,
        compareType,
        compareFromDate,
        compareToDate,
    });

    const notes = createNotes();

    const [currentPeriod, previousPeriod] = await Promise.all([
        buildPeriod(fromDate, toDate, notes),
        buildPeriod(comparison.from, comparison.to, notes),
    ]);

    const current = currentPeriod.totals;
    const previous = previousPeriod.totals;
    const posts = currentPeriod.posts;
    const period = { from: fromDate, to: toDate };
    const pageName = currentPeriod.page.name || "Facebook Page";
    const days = daysBetween(fromDate, toDate);

    const growth = calculateGrowth(current, previous);
    const formats = buildFormatAnalysis(posts);
    const highlights = buildHighlights(posts);
    const context = { current, previous, growth, posts, formats, highlights, days };

    const insights = buildInsights(context);

    return {
        meta: {
            pageName,
            apiVersion: API_VERSION,
            generatedAt: new Date().toISOString(),
        },
        period,
        comparison,
        current,
        previous,
        growth,
        posts,
        formats,
        highlights,
        summaryPoints: insights.slice(0, 4).map((item) => item.detail),
        takeaways: buildTakeaways(context),
        insights,
        recommendations: buildRecommendations(context),
        summary: buildSummary({ pageName, period, current, growth, highlights, posts }),
        dataNotes: buildDataNotes(notes),
    };
};

module.exports = {
    generatePostReport,
};
