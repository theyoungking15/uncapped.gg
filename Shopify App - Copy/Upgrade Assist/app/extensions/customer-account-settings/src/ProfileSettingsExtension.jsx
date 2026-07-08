import React, {useState} from "react";
import {
  BlockStack,
  Button,
  Card,
  InlineStack,
  Text,
  TextField,
  reactExtension,
} from "@shopify/ui-extensions-react/customer-account";

const CUSTOMER_ACCOUNT_API_VERSION = "2026-01";
const USERNAME_NAMESPACE = "custom";
const USERNAME_KEY = "public_handle";
const PREFERRED_CONTACT_NAMESPACE = "custom";
const PREFERRED_CONTACT_KEY = "preferred_contact_method";
const ALLOWED_CONTACT_METHODS = ["email", "phone", "messenger"];

export default reactExtension("customer-account.profile.block.render", async () => {
  const settings = await getCustomerSettings();
  return <ProfileSettingsCard {...settings} />;
});

function ProfileSettingsCard({customerId, username, preferredContactMethod, loadError}) {
  const [usernameValue, setUsernameValue] = useState(username ?? "");
  const [contactMethodValue, setContactMethodValue] = useState(preferredContactMethod ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(loadError || "");

  const handleReset = () => {
    setUsernameValue(username ?? "");
    setContactMethodValue(preferredContactMethod ?? "");
    setMessage("");
  };

  const handleSave = async () => {
    const normalizedUsername = normalizeUsername(usernameValue);
    if (usernameValue.trim() && !normalizedUsername) {
      setMessage("Username must be 3-30 characters and use only lowercase letters, numbers, hyphens, or underscores.");
      return;
    }

    const normalizedContactMethod = normalizePreferredContactMethod(contactMethodValue);
    if (contactMethodValue.trim() && !normalizedContactMethod) {
      setMessage("Preferred contact method must be email, phone, or messenger.");
      return;
    }

    setSaving(true);

    try {
      await setCustomerSettings(customerId, normalizedUsername, normalizedContactMethod);
      setUsernameValue(normalizedUsername);
      setContactMethodValue(normalizedContactMethod);
      setMessage("Account settings saved.");
    } catch (error) {
      setMessage(error?.message || "Unable to save account settings right now.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <BlockStack spacing="loose">
        <Text size="large">Account settings</Text>
        <Text>
          Set your username and preferred contact method for future account features. Username is stored in the
          custom.public_handle metafield, but it is not a Shopify login username and it is not treated as unique yet.
        </Text>

        <TextField label="Username" value={usernameValue} onChange={setUsernameValue} />
        <Text size="small">Use lowercase letters, numbers, hyphens, or underscores.</Text>

        <TextField
          label="Preferred contact method"
          value={contactMethodValue}
          onChange={setContactMethodValue}
        />
        <Text size="small">Allowed values: email, phone, messenger.</Text>

        {message ? <Text>{message}</Text> : null}

        <InlineStack>
          <Button onPress={handleReset}>Reset</Button>
          <Button loading={saving} onPress={handleSave}>
            Save settings
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

function normalizeUsername(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (!/^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?$/.test(normalized)) return "";
  return normalized;
}

function normalizePreferredContactMethod(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  return ALLOWED_CONTACT_METHODS.includes(normalized) ? normalized : "";
}

async function getCustomerSettings() {
  try {
    const response = await fetch(`shopify:customer-account/api/${CUSTOMER_ACCOUNT_API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query AccountSettings(
            $usernameNamespace: String!,
            $usernameKey: String!,
            $contactNamespace: String!,
            $contactKey: String!
          ) {
            customer {
              id
              username: metafield(namespace: $usernameNamespace, key: $usernameKey) {
                value
              }
              preferredContactMethod: metafield(namespace: $contactNamespace, key: $contactKey) {
                value
              }
            }
          }
        `,
        variables: {
          usernameNamespace: USERNAME_NAMESPACE,
          usernameKey: USERNAME_KEY,
          contactNamespace: PREFERRED_CONTACT_NAMESPACE,
          contactKey: PREFERRED_CONTACT_KEY,
        },
      }),
    });

    const payload = await response.json();

    if (!response.ok || payload.errors?.length) {
      throw new Error("Unable to load account settings from Shopify.");
    }

    return {
      customerId: payload.data.customer.id,
      username: payload.data.customer.username?.value || "",
      preferredContactMethod: payload.data.customer.preferredContactMethod?.value || "",
      loadError: "",
    };
  } catch (error) {
    return {
      customerId: "",
      username: "",
      preferredContactMethod: "",
      loadError: error?.message || "Unable to load account settings from Shopify.",
    };
  }
}

async function setCustomerSettings(customerId, username, preferredContactMethod) {
  if (!customerId) {
    throw new Error("Customer identity is missing from the customer account session.");
  }

  const metafields = [
    {
      namespace: USERNAME_NAMESPACE,
      key: USERNAME_KEY,
      ownerId: customerId,
      value: username ?? "",
    },
    {
      namespace: PREFERRED_CONTACT_NAMESPACE,
      key: PREFERRED_CONTACT_KEY,
      ownerId: customerId,
      value: preferredContactMethod ?? "",
    },
  ];

  const response = await fetch(`shopify:customer-account/api/${CUSTOMER_ACCOUNT_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        mutation SaveAccountSettings($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: {
        metafields,
      },
    }),
  });

  const payload = await response.json();
  const userErrors = payload?.data?.metafieldsSet?.userErrors || [];

  if (!response.ok || payload.errors?.length || userErrors.length) {
    const firstMessage =
      userErrors[0]?.message ||
      payload.errors?.[0]?.message ||
      "Unable to save account settings in Shopify.";
    throw new Error(firstMessage);
  }
}
