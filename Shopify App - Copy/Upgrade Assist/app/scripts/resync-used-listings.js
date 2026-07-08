const { listSubmissions, patchSubmission } = require("../src/lib/submission-store");
const {
  resolveBrandForSubmission,
  syncSubmissionFilesToShopify,
  createUsedListingMetaobject,
  updateUsedListingMetaobject,
  summarizeShopifyError
} = require("../src/lib/shopify-admin");

async function syncSubmission_(submission) {
  let submissionForRemote = submission;
  const brandResolution = await resolveBrandForSubmission(submissionForRemote);

  if (brandResolution && brandResolution.patch) {
    submissionForRemote = patchSubmission(submission.id, brandResolution.patch) || submissionForRemote;
  }

  const fileSync = await syncSubmissionFilesToShopify(submissionForRemote);

  if (fileSync && fileSync.hasPatch) {
    submissionForRemote = patchSubmission(submission.id, fileSync.patch) || submissionForRemote;
  }

  const remoteMetaobject = submissionForRemote.shopifyMetaobjectId
    ? await updateUsedListingMetaobject(submissionForRemote.shopifyMetaobjectId, submissionForRemote)
    : await createUsedListingMetaobject(submissionForRemote);

  return (
    patchSubmission(submission.id, {
      shopifyMetaobjectId: remoteMetaobject && remoteMetaobject.id ? String(remoteMetaobject.id) : "",
      shopifyMetaobjectHandle: remoteMetaobject && remoteMetaobject.handle ? String(remoteMetaobject.handle) : "",
      shopifySyncStatus: "synced",
      shopifySyncError: "",
      shopifyLastSyncedAt: new Date().toISOString()
    }) || submissionForRemote
  );
}

async function run() {
  const requestedIds = process.argv.slice(2).map((value) => String(value || "").trim()).filter(Boolean);
  const submissions = listSubmissions().filter((item) => !requestedIds.length || requestedIds.includes(item.id));

  if (!submissions.length) {
    console.log("No matching submissions found.");
    return;
  }

  const results = [];

  for (const submission of submissions) {
    try {
      const synced = await syncSubmission_(submission);
      results.push({
        id: synced.id,
        status: synced.status,
        sync: "synced",
        handle: synced.shopifyMetaobjectHandle || ""
      });
    } catch (error) {
      const summary = summarizeShopifyError(error);
      patchSubmission(submission.id, {
        shopifySyncStatus: "error",
        shopifySyncError: summary
      });
      results.push({
        id: submission.id,
        status: submission.status,
        sync: "error",
        detail: summary
      });
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

run().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
