import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Briefcase } from "lucide-react";

const JobPost = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [deadlineDays, setDeadlineDays] = useState("");
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
      
      const { error } = await supabase.from("jobs").insert({
        employer_id: userId,
        title,
        description,
        skills_required: skillsArray,
        location,
        budget: parseFloat(budget),
        deadline_days: parseInt(deadlineDays),
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Job posted successfully.",
      });

      navigate("/employer-dashboard");
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
              <Briefcase className="w-5 h-5 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Post a New Job</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="Senior React Developer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                placeholder="We are looking for..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Required Skills (comma-separated)</Label>
              <Textarea
                id="skills"
                placeholder="e.g., React, TypeScript, Node.js"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="budget">Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="5000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (days)</Label>
              <Input
                id="deadline"
                type="number"
                min="1"
                placeholder="30"
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Posting..." : "Post Job"}
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

export default JobPost;
