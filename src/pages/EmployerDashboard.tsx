import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Calendar, DollarSign, MapPin, Users } from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  skills_required: string[];
  location: string;
  budget: number;
  deadline_days: number;
  status: string;
  created_at: string;
}

const EmployerDashboard = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        fetchJobs(session.user.id);
      } else {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const fetchJobs = async (employerId: string) => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("employer_id", employerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "assigned": return "bg-blue-100 text-blue-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "declined": return "bg-red-100 text-red-800";
      case "completed": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Employer Dashboard</h1>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/job-post")}>Post New Job</Button>
            <Button onClick={() => navigate("/")} variant="outline">
              Home
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {jobs.map((job) => (
            <Card key={job.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-primary" />
                      {job.title}
                    </CardTitle>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => navigate(`/ai-match/${job.id}`)}
                    size="sm"
                    variant="outline"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View Matches
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{job.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>${job.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{job.deadline_days} days deadline</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Required Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {job.skills_required.map((skill, idx) => (
                      <Badge key={idx} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {jobs.length === 0 && (
          <Card className="shadow-md">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">You haven't posted any jobs yet.</p>
              <Button onClick={() => navigate("/job-post")}>
                Post Your First Job
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EmployerDashboard;
