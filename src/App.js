import React, { useState, forwardRef } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  DataTable,
  ButtonGroup,
  InlineStack,
  BlockStack,
  Text,
  Frame,
  Toast,
} from "@shopify/polaris";
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';

const ForwardedSelect = forwardRef((props, ref) => (
  <Select {...props} ref={ref} />
));

const ForwardedTextField = forwardRef((props, ref) => (
  <TextField {...props} ref={ref} />
));

// Tạo một QueryClient
const queryClient = new QueryClient();

export function Component() {
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      campaign: "",
      title: "",
      description: "",
      options: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const watchOptions = watch("options");

  const { data, error, isLoading } = useQuery({
    queryKey: ['volumeDiscount'],
    queryFn: async () => {
      const requestBody = {
        id: 0,
        campaign: watch("campaign"),
        title: watch("title"),
        description: watch("description"),
        discountRule: watchOptions.map(option => ({
          id: 0,
          title: option.title,
          subtitle: option.subtitle,
          label: option.label,
          quantity: option.quantity,
          discountType: option.discountType === "none" ? 0 : option.discountType === "percentage" ? 1 : 2,
          amount: option.discountType === "none" ? 0 : option.amount,
        })),
      };

      const response = await fetch("https://localhost:7233/api/volume-discount/get-volume-discount-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return response.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (requestBody) => {
      const response = await fetch("https://localhost:7233/api/volume-discount/get-volume-discount-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error('Network response was not ok');
      }

      return response.json();
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const requestBody = {
      id: 0,
      campaign: data.campaign,
      title: data.title,
      description: data.description,
      discountRule: data.options.map(option => ({
        id: 0,
        title: option.title,
        subtitle: option.subtitle,
        label: option.label,
        quantity: option.quantity,
        discountType: option.discountType === "none" ? 0 : option.discountType === "percentage" ? 1 : 2,
        amount: option.discountType === "none" ? 0 : option.amount,
      })),
    };

    mutation.mutate(requestBody, {
      onSuccess: (data) => {
        console.log("Data saved successfully:", data);
        setShowToast(true);
        setIsSubmitting(false);
      },
      onError: (error) => {
        console.error("Error saving data:", error);
        setIsSubmitting(false);
      },
    });
  };

  const handleAddOption = () => {
    const lastOption = watchOptions[watchOptions.length - 1];
    append({
      title: "",
      subtitle: "",
      label: "",
      quantity: lastOption ? lastOption.quantity + 1 : 1,
      discountType: "none",
    });
  };

  const getAmountSuffix = (discountType) => {
    switch (discountType) {
      case "percentage":
        return "%";
      case "fixed":
        return "$";
      default:
        return "";
    }
  };

  const previewData = watchOptions.map((option) => [
    option.title,
    option.discountType === "none"
      ? "None"
      : option.discountType === "percentage"
      ? "%discount"
      : "Discount / each",
    option.quantity,
    option.discountType === "none"
      ? ""
      : `${option.amount}${getAmountSuffix(option.discountType)}`,
  ]);

  return (
    <Frame>
      <Page
        breadcrumbs={[
          { content: "Back", url: "#" },
        ]}
        title="Create volume discount"
      >
        <Layout>
          <Layout.Section>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Card>
                <BlockStack gap="4">
                  <Text variant="headingMd" as="h2">
                    General
                  </Text>
                  <FormLayout>
                    <Controller
                      name="campaign"
                      control={control}
                      rules={{ required: "Campaign name is required" }}
                      render={({ field }) => (
                        <div>
                          <ForwardedTextField
                            label="Campaign"
                            {...field}
                            error={errors.campaign?.message}
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name="title"
                      control={control}
                      rules={{ required: "Title is required" }}
                      render={({ field }) => (
                        <div>
                          <ForwardedTextField
                            label="Title"
                            {...field}
                            error={errors.title?.message}
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <ForwardedTextField
                            label="Description"
                            {...field}
                            multiline={3}
                          />
                        </div>
                      )}
                    />
                  </FormLayout>
                </BlockStack>

                <BlockStack gap="4">
                  <Text variant="headingMd" as="h2">
                    Volume discount rule
                  </Text>
                  {fields.map((field, index) => (
                    <BlockStack key={field.id} gap="4">
                      <InlineStack align="space-between">
                        <Text variant="headingMd">OPTION {index + 1}</Text>
                        {index >= 0 && (
                          <Button
                            plain
                            destructive
                            onClick={() => remove(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </InlineStack>
                      <FormLayout>
                        <FormLayout.Group>
                          <Controller
                            name={`options.${index}.title`}
                            control={control}
                            rules={{ required: "Title is required" }}
                            render={({ field }) => (
                              <div>
                                <ForwardedTextField
                                  label="Title"
                                  {...field}
                                  error={errors.options?.[index]?.title?.message}
                                />
                              </div>
                            )}
                          />
                          <Controller
                            name={`options.${index}.subtitle`}
                            control={control}
                            rules={{ required: "Subtitle is required" }}
                            render={({ field }) => (
                              <div>
                                <ForwardedTextField
                                  label="Subtitle"
                                  {...field}
                                />
                              </div>
                            )}
                          />
                          <Controller
                            name={`options.${index}.label`}
                            control={control}
                            render={({ field }) => (
                              <div>
                                <ForwardedTextField
                                  label="Label (optional)"
                                  {...field}
                                />
                              </div>
                            )}
                          />
                        </FormLayout.Group>
                        <FormLayout.Group>
                          <Controller
                            name={`options.${index}.quantity`}
                            control={control}
                            rules={{
                              required: "Quantity is required",
                              min: {
                                value: 1,
                                message: "Quantity must be at least 1",
                              },
                            }}
                            render={({ field }) => (
                              <div>
                                <ForwardedTextField
                                  label="Quantity"
                                  type="number"
                                  {...field}
                                  error={
                                    errors.options?.[index]?.quantity?.message
                                  }
                                />
                              </div>
                            )}
                          />
                          <Controller
                            name={`options.${index}.discountType`}
                            control={control}
                            render={({ field }) => (
                              <ForwardedSelect
                                label="Discount type"
                                options={[
                                  { label: "None", value: "none" },
                                  { label: "% discount", value: "percentage" },
                                  { label: "Discount / each", value: "fixed" },
                                ]}
                                {...field}
                              />
                            )}
                          />
                          {watchOptions[index]?.discountType !== "none" && (
                            <Controller
                              name={`options.${index}.amount`}
                              control={control}
                              rules={{
                                required: "Amount is required",
                                min: {
                                  value: 0,
                                  message: "Amount must be at least 0",
                                },
                              }}
                              render={({ field }) => (
                                <div>
                                  <ForwardedTextField
                                    label="Amount"
                                    type="number"
                                    {...field}
                                    suffix={getAmountSuffix(
                                      watchOptions[index]?.discountType
                                    )}
                                    error={
                                      errors.options?.[index]?.amount?.message
                                    }
                                  />
                                </div>
                              )}
                            />
                          )}
                        </FormLayout.Group>
                      </FormLayout>
                    </BlockStack>
                  ))}
                  <Button onClick={handleAddOption} fullWidth>
                    Add option
                  </Button>
                </BlockStack>
              </Card>
              <div style={{ marginTop: "1rem" }}>
                <ButtonGroup>
                  <Button submit primary disabled={isSubmitting}>
                    {isSubmitting ? "Đang lưu..." : "Lưu"}
                  </Button>
                </ButtonGroup>
              </div>
            </form>
          </Layout.Section>

          <Layout.Section secondary>
            <Card>
              <BlockStack gap="4">
                <Text variant="headingMd" as="h2">
                  Preview
                </Text>
                <BlockStack>
                  <Text variant="headingLg">Buy more and save</Text>
                  <Text>Apply for all products in store</Text>
                  <div style={{ marginTop: "1rem" }}>
                    <DataTable
                      columnContentTypes={["text", "text", "numeric", "text"]}
                      headings={[
                        "Title",
                        "Discount Type",
                        "Quantity",
                        "Amount",
                      ]}
                      rows={previewData}
                    />
                  </div>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {showToast && (
          <Toast
            content="Form submitted successfully"
            onDismiss={() => setShowToast(false)}
          />
        )}
        {isLoading && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}
      </Page>
    </Frame>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Component />
    </QueryClientProvider>
  );
}
