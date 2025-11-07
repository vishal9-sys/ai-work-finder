import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Star, MapPin, Briefcase, Mail, Sparkles } from "lucide-react";

interface Worker {
  id: string;
  skills: string[];
  experience: number;
  location: string;
  contact: string;
  profile_pic_url: string | null;
  profiles: {
    full_name: string;
  };
  reviews: Array<{ rating: number }>;
}

interface MatchedWorker extends Worker {
  matchScore: number;
}

const AIMatch = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState<any>(null);
  const [matches, setMatches] = useState<MatchedWorker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (jobId) {
      fetchJobAndMatches();
    }
  }, [jobId]);

  const fetchJobAndMatches = async () => {
    try {
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      const { data: response, error: functionError } = await supabase.functions.invoke("ai-match", {
        body: { jobId },
      });

      if (functionError) throw functionError;
      setMatches(response.matches || []);
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

  const handleAssignWorker = async (workerId: string) => {
    try {
      const { error: appError } = await supabase.from("applications").insert({
        worker_id: workerId,
        job_id: jobId,
        status: "pending",
      });

      if (appError) throw appError;

      const { error: jobError } = await supabase
        .from("jobs")
        .update({ status: "assigned" })
        .eq("id", jobId);

      if (jobError) throw jobError;

      toast({
        title: "Worker assigned!",
        description: "The worker has been notified about this job offer.",
      });

      navigate("/employer-dashboard");
    } catch (error: any) {
      if (error.code === "23505") {
        toast({
          title: "Already assigned",
          description: "This worker has already been offered this job.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const calculateAverageRating = (reviews: Array<{ rating: number }>) => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Finding best matches...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary" />
              AI-Matched Workers
            </h1>
            {job && <p className="text-muted-foreground mt-2">for "{job.title}"</p>}
          </div>
          <Button onClick={() => navigate("/employer-dashboard")} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((worker, index) => (
            <Card key={worker.id} className="shadow-md hover:shadow-lg transition-shadow relative">
              {index === 0 && (
                <div className="absolute -top-3 -right-3 bg-gradient-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                  Best Match
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <Avatar className="w-20 h-20 mx-auto mb-3">
                  <AvatarImage src={worker.profile_pic_url || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    {getInitials(worker.profiles.full_name)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{worker.profiles.full_name}</CardTitle>
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{calculateAverageRating(worker.reviews)} ({worker.reviews.length} reviews)</span>
                </div>
                <Badge className="mt-2 bg-green-100 text-green-800">
                  Match Score: {worker.matchScore}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{worker.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span>{worker.experience} years experience</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{worker.contact}</span>
                </div>
                <div className="pt-2">
                  <p className="text-sm font-semibold mb-2">Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {worker.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button 
                  className="w-full mt-4"
                  onClick={() => handleAssignWorker(worker.id)}
                >
                  Assign to Job
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {matches.length === 0 && (
          <Card className="shadow-md">
            <CardContent className="py-12 text-center text-muted-foreground">
              No matching workers found for this job.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AIMatch;
