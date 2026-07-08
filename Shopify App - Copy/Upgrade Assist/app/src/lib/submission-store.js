const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { config } = require("../config");

function ensureStorage_() {
  fs.mkdirSync(config.storageDir, { recursive: true });
  fs.mkdirSync(config.uploadsDir, { recursive: true });
  if (!fs.existsSync(config.submissionsFile)) {
    fs.writeFileSync(config.submissionsFile, "[]\n", "utf8");
  }
}

function readAll_() {
  ensureStorage_();
  try {
    const raw = fs.readFileSync(config.submissionsFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeAll_(items) {
  ensureStorage_();
  fs.writeFileSync(config.submissionsFile, `${JSON.stringify(items, null, 2)}\n`, "utf8");
}

function listSubmissions() {
  return readAll_().sort((a, b) => {
    const aTime = Date.parse(a.createdAt || 0) || 0;
    const bTime = Date.parse(b.createdAt || 0) || 0;
    return bTime - aTime;
  });
}

function getSubmissionById(id) {
  return listSubmissions().find((item) => item.id === id) || null;
}

function createSubmission(data) {
  const items = readAll_();
  const now = new Date().toISOString();
  const submission = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: "pending_review",
    reviewNotes: "",
    publishedAt: "",
    shopifyMetaobjectId: "",
    shopifyMetaobjectHandle: "",
    shopifySyncStatus: "pending",
    shopifySyncError: "",
    shopifyLastSyncedAt: "",
    ...data
  };

  items.push(submission);
  writeAll_(items);
  return submission;
}

function patchSubmission(id, patch) {
  const items = readAll_();
  const target = items.find((item) => item.id === id);
  if (!target) return null;

  Object.assign(target, patch || {});
  target.updatedAt = new Date().toISOString();

  writeAll_(items);
  return target;
}

function updateSubmissionStatus(id, nextStatus, reviewNotes) {
  const items = readAll_();
  const target = items.find((item) => item.id === id);
  if (!target) return null;

  target.status = nextStatus;
  target.reviewNotes = String(reviewNotes || "").trim();
  target.updatedAt = new Date().toISOString();
  target.publishedAt = nextStatus === "approved" ? target.updatedAt : "";

  writeAll_(items);
  return target;
}

function deleteSubmissionUploads_(item) {
  const filenames = new Set();

  if (Array.isArray(item.photos)) {
    item.photos.forEach((photo) => {
      if (photo && photo.filename) filenames.add(path.basename(String(photo.filename)));
    });
  }

  if (item.proofOfPurchaseFile && item.proofOfPurchaseFile.filename) {
    filenames.add(path.basename(String(item.proofOfPurchaseFile.filename)));
  }

  filenames.forEach((filename) => {
    const filePath = path.join(config.uploadsDir, filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {}
  });
}

function deleteSubmission(id) {
  const items = readAll_();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return null;

  const [removed] = items.splice(index, 1);
  deleteSubmissionUploads_(removed);
  writeAll_(items);
  return removed;
}

function getSubmissionCounts() {
  return listSubmissions().reduce(
    (acc, item) => {
      const key = item.status || "pending_review";
      acc.total += 1;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    { total: 0, pending_review: 0, approved: 0, rejected: 0, archived: 0 }
  );
}

module.exports = {
  listSubmissions,
  getSubmissionById,
  createSubmission,
  patchSubmission,
  updateSubmissionStatus,
  deleteSubmission,
  getSubmissionCounts,
  ensureStorage_
};
