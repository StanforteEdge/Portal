import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel, FormTextarea } from "@/components/Base/Form";
import { getMyProfile, updateMyProfile } from "@/services/profile";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";

type ProfileFormValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  occupation: string;
  bio: string;
  address: string;
};

const schema: yup.ObjectSchema<ProfileFormValues> = yup.object({
  first_name: yup.string().required("First name is required"),
  last_name: yup.string().required("Last name is required"),
  email: yup.string().required("Email is required").email("Enter a valid email"),
  phone: yup.string().optional().default(""),
  occupation: yup.string().optional().default(""),
  bio: yup.string().optional().default(""),
  address: yup.string().optional().default(""),
});

function UpdateProfilePage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(
    null
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      occupation: "",
      bio: "",
      address: "",
    },
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profile = await getMyProfile();
        reset({
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          occupation: "",
          bio: "",
          address: "",
        });
      } catch (error: any) {
        setNotice({
          tone: "error",
          message: error?.response?.data?.error?.message || "Unable to load profile.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setSaving(true);
      setNotice(null);
      await updateMyProfile(values);
      setNotice({ tone: "success", message: "Profile updated successfully." });
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to update profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Profile</h2>
        <Link className="btn btn-outline-secondary" to="/change-password">
          Change Password
        </Link>
      </div>

      <div className="mt-5 intro-y box">
        <div className="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
          <h2 className="mr-auto text-base font-medium">Edit Profile</h2>
        </div>

        <div className="p-5">
          {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mb-4" /> : null}
          {loading ? (
            <div className="text-slate-500">Loading profile...</div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <FormLabel htmlFor="first_name">First Name</FormLabel>
                  <FormInput id="first_name" type="text" {...register("first_name")} />
                  {errors.first_name?.message ? (
                    <p className="mt-2 text-sm text-danger">{errors.first_name.message}</p>
                  ) : null}
                </div>

                <div>
                  <FormLabel htmlFor="last_name">Last Name</FormLabel>
                  <FormInput id="last_name" type="text" {...register("last_name")} />
                  {errors.last_name?.message ? (
                    <p className="mt-2 text-sm text-danger">{errors.last_name.message}</p>
                  ) : null}
                </div>

                <div>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <FormInput id="email" type="email" {...register("email")} />
                  {errors.email?.message ? (
                    <p className="mt-2 text-sm text-danger">{errors.email.message}</p>
                  ) : null}
                </div>

                <div>
                  <FormLabel htmlFor="phone">Phone</FormLabel>
                  <FormInput id="phone" type="text" {...register("phone")} />
                </div>

                <div>
                  <FormLabel htmlFor="occupation">Occupation</FormLabel>
                  <FormInput id="occupation" type="text" {...register("occupation")} />
                </div>
              </div>

              <div>
                <FormLabel htmlFor="address">Address</FormLabel>
                <FormTextarea id="address" rows={3} {...register("address")} />
              </div>

              <div>
                <FormLabel htmlFor="bio">Bio</FormLabel>
                <FormTextarea id="bio" rows={3} {...register("bio")} />
              </div>

              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default UpdateProfilePage;
