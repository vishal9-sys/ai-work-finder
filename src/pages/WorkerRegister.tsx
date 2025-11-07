import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

const WorkerRegister = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);

    try {
      const skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean);
      
      const { error } = await supabase.from("workers").insert({
        user_id: userId,
        skills: skillsArray,
        experience: parseInt(experience) || 0,
        location,
        contact,
        profile_pic_url: profilePicUrl || null,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Worker profile created successfully.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 py-12">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Complete Your Worker Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Textarea
                id="skills"
                placeholder="e.g., React, Python, Design, Marketing"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                placeholder="3"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                type="text"
                placeholder="New York, USA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact Email</Label>
              <Input
                id="contact"
                type="email"
                placeholder="worker@example.com"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-pic">Profile Picture URL (optional)</Label>
              <Input
                id="profile-pic"
                type="url"
                placeholder="https://..."
                value={profilePicUrl}
                onChange={(e) => setProfilePicUrl(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Creating..." : "Create Profile"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkerRegister;
