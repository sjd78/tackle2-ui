import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosResponse } from "axios";
import * as yup from "yup";
import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Tracker, Application, IssueManagerKind, Ref } from "@app/api/models";
import { IssueManagerOptions, toOptionLike } from "@app/utils/model-utils";
import {
  getTrackersByKind,
  getTrackerProjectsByInstance,
  getTrackerTypesByProjectName,
} from "@app/queries/trackers";
import { OptionWithValue, SimpleSelect } from "@app/shared/components";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { HookFormPFGroupController } from "@app/shared/components/hook-form-pf-fields";
import { NotificationsContext } from "@app/shared/notifications-context";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { useCreateTicketMutation } from "@app/queries/tickets";

interface FormValues {
  issueManager: IssueManagerKind | undefined;
  instance: string;
  project: string;
  kind: string;
}

export interface ExportFormProps {
  applications: Ref[];
  instances: Tracker[];
  onClose: () => void;
}

export const ExportForm: React.FC<ExportFormProps> = ({
  applications,
  instances,
  onClose,
}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);
  const [axiosError, setAxiosError] = useState<AxiosError>();

  const onExportSuccess = (_: AxiosResponse<Tracker>) =>
    pushNotification({
      title: t("toastr.success.create", {
        type: t("terms.ticket"),
      }),
      variant: "success",
    });

  const onExportError = (error: AxiosError) => {
    setAxiosError(error);
  };

  const { mutate: createTicket } = useCreateTicketMutation(
    onExportSuccess,
    onExportError
  );

  const validationSchema: yup.SchemaOf<FormValues> = yup.object().shape({
    issueManager: yup.mixed<IssueManagerKind>().required(),
    instance: yup.string().required(),
    project: yup.string().required(),
    kind: yup.string().required(),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    getValues,
    setValue,
    control,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      issueManager: undefined,
      instance: "",
      project: "",
      kind: "",
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const values = getValues();

  const onSubmit = (formValues: FormValues) => {
    const matchingInstance = instances.find(
      (instance) => formValues?.instance === instance.name
    );
    const matchingProject = getTrackerProjectsByInstance(
      instances,
      formValues.instance
    ).find((project) => formValues.project === project.name);
    const matchingKind = getTrackerTypesByProjectName(
      instances,
      formValues.instance,
      formValues.project
    ).find((type) => formValues.kind === type.name);

    if (matchingInstance) {
      const payload = {
        issueManager: formValues.issueManager?.trim(),
        tracker: { id: matchingInstance.id, name: matchingInstance.name },
        parent: matchingProject?.id || "",
        kind: matchingKind?.id || "",
      };

      applications?.forEach((application) =>
        createTicket({
          ...payload,
          application: {
            id: application.id,
            name: application.name,
          },
        })
      );
    }
    onClose();
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      {axiosError && (
        <Alert
          variant="danger"
          isInline
          title={getAxiosErrorMessage(axiosError)}
        />
      )}
      <HookFormPFGroupController
        control={control}
        name="issueManager"
        label="Issue Manager"
        fieldId="issue-manager-select"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            id="issue-manager-select"
            toggleId="issue-manager-select-toggle"
            variant="typeahead"
            placeholderText={t("composed.selectAn", {
              what: t("terms.instanceType").toLowerCase(),
            })}
            toggleAriaLabel="Type select dropdown toggle"
            aria-label={name}
            value={value ? toOptionLike(value, IssueManagerOptions) : undefined}
            options={IssueManagerOptions}
            onChange={(selection) => {
              const selectionValue =
                selection as OptionWithValue<IssueManagerKind>;
              setValue("instance", "");
              setValue("project", "");
              setValue("kind", "");
              onChange(selectionValue.value);
            }}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="instance"
        label={t("terms.instance")}
        fieldId="instance-select"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            id="instance-select"
            toggleId="instance-select-toggle"
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            variant="typeahead"
            placeholderText={t("composed.selectAn", {
              what: t("terms.instance").toLowerCase(),
            })}
            toggleAriaLabel="Instance select dropdown toggle"
            aria-label={name}
            value={value}
            options={
              values.issueManager
                ? getTrackersByKind(
                    instances,
                    values.issueManager?.toString()
                  ).map((instance) => {
                    return {
                      value: instance.name,
                      toString: () => instance.name,
                    };
                  })
                : []
            }
            onChange={(selection) => {
              const selectionValue = selection as OptionWithValue<string>;
              setValue("project", "");
              setValue("kind", "");
              onChange(selectionValue.value);
            }}
            onClear={() => onChange("")}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="project"
        label={t("terms.project")}
        fieldId="project-select"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            id="project-select"
            toggleId="project-select-toggle"
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            variant="typeahead"
            placeholderText={t("composed.selectOne", {
              what: t("terms.project").toLowerCase(),
            })}
            toggleAriaLabel="project select dropdown toggle"
            aria-label={name}
            value={value}
            options={getTrackerProjectsByInstance(
              instances,
              values.instance
            ).map((project) => {
              return {
                value: project.name,
                toString: () => project.name,
              };
            })}
            onChange={(selection) => {
              const selectionValue = selection as OptionWithValue<string>;
              setValue("kind", "");
              onChange(selectionValue.value);
            }}
            onClear={() => onChange("")}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="kind"
        label={t("terms.issueType")}
        fieldId="issue-type-select"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            id="issue-type-select"
            toggleId="issue-type-select-toggle"
            maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
            variant="typeahead"
            placeholderText={t("composed.selectAn", {
              what: t("terms.issueType").toLowerCase(),
            })}
            toggleAriaLabel="issue-type select dropdown toggle"
            aria-label={name}
            value={value}
            options={getTrackerTypesByProjectName(
              instances,
              values.instance,
              values.project
            ).map((issueType) => {
              return {
                value: issueType.name,
                toString: () => issueType.name,
              };
            })}
            onChange={(selection) => {
              const selectionValue = selection as OptionWithValue<string>;
              onChange(selectionValue.value);
            }}
            onClear={() => onChange("")}
          />
        )}
      />
      <ActionGroup>
        <Button
          type="submit"
          aria-label="submit"
          id="identity-form-submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {t("actions.export")}
        </Button>
        <Button
          type="button"
          id="cancel"
          aria-label="cancel"
          variant={ButtonVariant.link}
          isDisabled={isSubmitting || isValidating}
          onClick={onClose}
        >
          {t("actions.cancel")}
        </Button>
      </ActionGroup>
    </Form>
  );
};