import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Save, User } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createUser, listUsers, updateUser } from "../api/user";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: () => listUsers(),
    staleTime: 120000,
  });

  // Load existing profile
  useEffect(() => {
    if (!user || !profiles.length) return;
    const myProfile = profiles.find((p) => p.user_email === user.email);
    if (myProfile) {
      setUsername(myProfile.username || "");
      setAvatarUrl(myProfile.avatar_url || "");
    } else {
      setUsername(user.full_name || user.email.split("@")[0]);
    }
  }, [user, profiles]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const myProfile = profiles.find((p) => p.user_email === user.email);
      const data = {
        user_email: user.email,
        username: username.trim(),
        avatar_url: avatarUrl,
      };

      if (myProfile) {
        return updateUser(myProfile.id, data);
      } else {
        return createUser(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["profiles"]);
      toast.success("Profile saved!");
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or smaller.");
      return;
    }
    try {
      setUploading(true);

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const storageRef = ref(storage, `/images/${fileName}`);

      await uploadBytes(storageRef, file, {
        contentType: file.type,
      });

      const file_url = await getDownloadURL(storageRef);

      setAvatarUrl(file_url);

      toast.success("Image uploaded successfully.");
    } catch (error) {
      toast.error("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h2 className="font-oswald text-3xl font-bold text-foreground uppercase tracking-wide">
          Profile
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your display name and picture
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 space-y-6"
      >
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-border"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-border">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
            )}

            <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
              {uploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Click to upload a photo
          </p>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium">
            Display Name
          </Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your display name"
            className="bg-background"
          />
        </div>

        {/* Email (read only) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Email</Label>
          <Input
            value={user.email}
            disabled
            className="bg-muted text-muted-foreground"
          />
        </div>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !username.trim()}
          className="w-full"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Profile
        </Button>
      </motion.div>
    </div>
  );
}
