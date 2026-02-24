"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { NATIONALITIES } from "@/lib/utils";
import type { GuestDetails } from "@/lib/types";

interface GuestFormProps {
  initialValues?: GuestDetails | null;
  onSubmit: (details: GuestDetails) => void;
  onBack: () => void;
}

type FormErrors = Partial<Record<keyof GuestDetails, string>>;

export function GuestForm({ initialValues, onSubmit, onBack }: GuestFormProps) {
  const [form, setForm] = useState<GuestDetails>({
    FirstName: initialValues?.FirstName ?? "",
    LastName: initialValues?.LastName ?? "",
    Email: initialValues?.Email ?? "",
    Phone: initialValues?.Phone ?? "",
    NationalityCode: initialValues?.NationalityCode ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  function set<K extends keyof GuestDetails>(key: K, value: GuestDetails[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.FirstName.trim()) e.FirstName = "First name is required";
    if (!form.LastName.trim()) e.LastName = "Last name is required";
    if (!form.Email.trim()) e.Email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.Email)) e.Email = "Enter a valid email address";
    if (!form.Phone.trim()) e.Phone = "Phone number is required";
    if (!form.NationalityCode) e.NationalityCode = "Select a nationality";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  const nationalityOptions = NATIONALITIES.map((n) => ({ value: n.code, label: n.name }));

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={form.FirstName}
            onChange={(e) => set("FirstName", e.target.value)}
            error={errors.FirstName}
            placeholder="Per"
            autoComplete="given-name"
            maxLength={100}
          />
          <Input
            label="Last Name"
            value={form.LastName}
            onChange={(e) => set("LastName", e.target.value)}
            error={errors.LastName}
            placeholder="Andersen"
            autoComplete="family-name"
            maxLength={100}
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={form.Email}
          onChange={(e) => set("Email", e.target.value)}
          error={errors.Email}
          placeholder="per@example.com"
          autoComplete="email"
          maxLength={254}
        />

        <Input
          label="Phone"
          type="tel"
          value={form.Phone}
          onChange={(e) => set("Phone", e.target.value)}
          error={errors.Phone}
          placeholder="+47 900 00 000"
          autoComplete="tel"
          maxLength={30}
        />

        <Select
          label="Nationality"
          value={form.NationalityCode}
          onChange={(e) => set("NationalityCode", e.target.value)}
          error={errors.NationalityCode}
          options={nationalityOptions}
          placeholder="Select nationality"
        />
      </div>

      <div className="flex gap-3 mt-8">
        <Button type="button" variant="secondary" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" variant="primary" arrow className="flex-1">
          Continue
        </Button>
      </div>
    </form>
  );
}
