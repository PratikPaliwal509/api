const prisma = require('../config/db');

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});
// Helper to convert BigInt to string for JSON serialization
const formatAttachment = (attachment) => ({
  ...attachment,
  file_size: attachment.file_size?.toString() || null
});

const addAttachment = async (taskId, data, userId) => {
  const attachment = await prisma.taskAttachment.create({
    data: {
      task_id: taskId,
      file_name: data.file_name,
      file_original_name: data.file_original_name,
      file_path: data.file_path,
      file_url: data.file_url,
      file_size: BigInt(data.file_size),
      file_type: data.file_type,
      file_extension: data.file_extension,
      image_width: data.image_width,
      image_height: data.image_height,
      uploaded_by: userId
    }
  });
  return formatAttachment(attachment);
};

const getAttachmentsByTask = async (taskId) => {
  const attachments = await prisma.taskAttachment.findMany({
    where: {
      task_id: taskId,
      is_deleted: false
    },
    orderBy: { uploaded_at: 'desc' }
  });
  return attachments.map(formatAttachment);
};


const deleteAttachment = async (attachmentId, userId) => {
  // 1️⃣ Get attachment
  const existingAttachment = await prisma.taskAttachment.findUnique({
    where: { attachment_id: attachmentId },
  });

  if (!existingAttachment) {
    throw new Error("Attachment not found");
  }
  console.log(existingAttachment.file_path, existingAttachment.file_type)
  // 2️⃣ Delete from Cloudinary
  if (existingAttachment.file_path) {
    try {
      await cloudinary.uploader.destroy(existingAttachment.file_path, {
        resource_type: existingAttachment.file_type || "image",// ✅ important for all file types
      });
    } catch (err) {
      console.log("Cloudinary delete failed:", err.message);
      console.error("Cloudinary delete failed:", err.message);
      // don't block DB delete
    }
  }

  // 3️⃣ Soft delete in DB
  const attachment = await prisma.taskAttachment.update({
    where: { attachment_id: attachmentId },
    data: {
      is_deleted: true,
      deleted_at: new Date(),
      deleted_by: userId,
    },
  });

  return formatAttachment(attachment);
};

module.exports = {
  addAttachment,
  getAttachmentsByTask,
  deleteAttachment
};
