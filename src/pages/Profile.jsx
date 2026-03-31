import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { auth, storage, db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, User } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (!user) return;
    setUsername(user.displayName || "");
    setName(user.displayName || "");
    setAvatarUrl(user.photoURL || "");
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    let photoURL = user.photoURL || "";

    if (file) {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      photoURL = await getDownloadURL(storageRef);
      setAvatarUrl(photoURL);
      toast.success("Image uploaded successfully.");
    }

    await updateProfile(auth.currentUser, {
      displayName: username,
      photoURL,
    });

    await setDoc(
      doc(db, "users", user.uid),
      {
        user_id: user.uid,
        user_email: user.email || "",
        username,
        name,
        avatar_url: photoURL,
        updated_at: Date.now(),
      },
      { merge: true },
    );

    toast.success("Profile updated!");
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h2 className="font-oswald text-3xl font-bold text-foreground uppercase tracking-wide">
          Profile
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your display name and picture
        </p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-6 space-y-6"
        >
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
                <Camera className="w-6 h-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

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

          <div className="space-y-2">
            <Label className="text-sm font-medium">Email</Label>
            <Input
              value={user?.email || ""}
              disabled
              className="bg-muted text-muted-foreground"
            />
          </div>

          <Button className="w-full" onClick={handleSave}>
            Save
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
