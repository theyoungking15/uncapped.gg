function asString(value) {
  return String(value || "").trim();
}

function asBoolean(value) {
  const normalized = asString(value).toLowerCase();
  return ["true", "1", "yes", "on"].includes(normalized);
}

function normalizeFiles(files) {
  return Array.isArray(files)
    ? files.map((file) => ({
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size
      }))
    : [];
}

function normalizePayload(body, filesByField) {
  const sourceType = asString(body.source_type || "catalog_reference") || "catalog_reference";
  const proofStatus = asString(body.proof_of_purchase_status);
  const personalWarranty = asString(body.personal_warranty_offered);

  return {
    status: "pending_review",
    sellerCustomerId: asString(body.seller_customer_id || body.logged_in_customer_id),
    sourceType,
    referencedProduct: sourceType === "catalog_reference" ? asString(body.referenced_product) : "",
    referencedProductTitle: sourceType === "catalog_reference" ? asString(body.referenced_product_title) : "",
    referencedProductUrl: sourceType === "catalog_reference" ? asString(body.referenced_product_url) : "",
    manualTitle: sourceType === "manual_entry" ? asString(body.manual_title) : "",
    manualModel: sourceType === "manual_entry" ? asString(body.manual_model) : "",
    externalProductUrl: sourceType === "manual_entry" ? asString(body.external_product_url) : "",
    brandReference: sourceType === "manual_entry" ? asString(body.brand_reference) : "",
    brandNameFallback: sourceType === "manual_entry" ? asString(body.brand_name_fallback) : "",
    askingPrice: asString(body.asking_price),
    conditionGrade: asString(body.condition_grade),
    cityRegion: asString(body.city_region),
    usageNotes: asString(body.usage_notes),
    issueDisclosures: asString(body.issue_disclosures),
    photos: normalizeFiles(filesByField.photos),
    proofOfPurchaseStatus: proofStatus,
    proofOfPurchaseFile: proofStatus === "picture" ? normalizeFiles(filesByField.proof_of_purchase_file)[0] || null : null,
    personalWarrantyOffered: personalWarranty,
    personalWarrantyDuration: personalWarranty === "yes" ? asString(body.personal_warranty_duration) : "",
    stillInWarranty: asString(body.still_in_warranty),
    contactPreference: asString(body.contact_preference),
    contactValue: asString(body.contact_value),
    sellerAgreementAccepted: asBoolean(body.seller_agreement_accepted),
    integrationState: asString(body.integration_state || "local_app"),
    rawCustomerEmail: asString(body.customer_email || ""),
    rawCustomerFirstName: asString(body.customer_first_name || ""),
    rawCustomerLastName: asString(body.customer_last_name || ""),
    rawCustomerPhone: asString(body.customer_phone || "")
  };
}

function validatePayload(payload) {
  const errors = {};
  const askingPrice = Number(payload.askingPrice);

  if (!payload.sellerCustomerId) {
    errors.sellerCustomerId = "Missing seller customer ID.";
  }

  if (!payload.rawCustomerEmail) {
    errors.customerAccount = "Customer account email is required before posting.";
  }

  if (!payload.rawCustomerFirstName) {
    errors.customerAccount = "Customer account first name is required before posting.";
  }

  if (!payload.rawCustomerLastName) {
    errors.customerAccount = "Customer account last name is required before posting.";
  }

  if (!payload.rawCustomerPhone) {
    errors.customerAccount = "Customer account phone number is required before posting.";
  }

  if (!["catalog_reference", "manual_entry"].includes(payload.sourceType)) {
    errors.sourceType = "Invalid source type.";
  }

  if (payload.sourceType === "catalog_reference" && !payload.referencedProduct) {
    errors.referencedProduct = "Referenced product is required.";
  }

  if (payload.sourceType === "manual_entry") {
    if (!payload.manualTitle) {
      errors.manualTitle = "Manual title is required.";
    }

    if (!payload.brandReference && !payload.brandNameFallback) {
      errors.brand = "Brand reference or fallback brand name is required.";
    }

    if (payload.externalProductUrl) {
      try {
        new URL(payload.externalProductUrl);
      } catch (error) {
        errors.externalProductUrl = "External product URL must be valid.";
      }
    }
  }

  if (!Number.isFinite(askingPrice) || askingPrice <= 0) {
    errors.askingPrice = "Asking price must be greater than zero.";
  }

  if (!payload.conditionGrade) {
    errors.conditionGrade = "Condition grade is required.";
  }

  if (!payload.cityRegion) {
    errors.cityRegion = "City / region is required.";
  }

  if (!payload.usageNotes) {
    errors.usageNotes = "Usage notes are required.";
  }

  if (!Array.isArray(payload.photos) || payload.photos.length < 1) {
    errors.photos = "At least one photo is required.";
  }

  if (!payload.proofOfPurchaseStatus) {
    errors.proofOfPurchaseStatus = "Proof of purchase status is required.";
  }

  if (payload.proofOfPurchaseStatus === "picture" && !payload.proofOfPurchaseFile) {
    errors.proofOfPurchaseFile = "Proof of purchase file is required when proof status is picture.";
  }

  if (!payload.stillInWarranty) {
    errors.stillInWarranty = "Still in warranty is required.";
  }

  if (!payload.personalWarrantyOffered) {
    errors.personalWarrantyOffered = "Personal warranty offered is required.";
  }

  if (payload.personalWarrantyOffered === "yes" && !payload.personalWarrantyDuration) {
    errors.personalWarrantyDuration = "Personal warranty duration is required.";
  }

  if (!payload.contactPreference) {
    errors.contactPreference = "Contact preference is required.";
  }

  if (payload.contactPreference === "email" && !payload.rawCustomerEmail) {
    errors.contactPreference = "Your Shopify account email is missing. Use another contact method or update your account email.";
  }

  if (["phone", "messenger"].includes(payload.contactPreference) && !payload.contactValue) {
    errors.contactValue = payload.contactPreference === "phone"
      ? "Phone number is required when phone / SMS is selected."
      : "Messenger handle or link is required when Messenger is selected.";
  }

  if (!payload.sellerAgreementAccepted) {
    errors.sellerAgreementAccepted = "Seller agreement must be accepted.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

module.exports = {
  normalizePayload,
  validatePayload
};
