import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Calendar, DollarSign, MapPin, CheckCircle, XCircle } from "lucide-react";

interface Application {
  id: string;
  status: string;
  jobs: {
    id: string;
    title: string;
    description: string;
    skills_required: string[];
    location: string;
    budget: number;
    deadline_days: number;
    profiles: {
      full_name: string;
    };
  };
}

const WorkerDashboard = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await fetchWorkerProfile(session.user.id);
      } else {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const fetchWorkerProfile = async (userId: string) => {
    try {
      const { data: workerData, error: workerError } = await supabase
        .from("workers")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (workerError) {
        if (workerError.code === "PGRST116") {
          toast({
            title: "No worker profile",
            description: "Please complete your worker profile first.",
          });
          navigate("/worker-register");
        }
        throw workerError;
      }

      setWorkerId(workerData.id);
      await fetchApplications(workerData.id);
    } catch (error: any) {
      console.error("Error fetching worker profile:", error);
    }
  };

  const fetchApplications = async (workerId: string) => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          jobs (
            *,
            profiles (full_name)
          )
        `)
        .eq("worker_id", workerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
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

  const handleAccept = async (applicationId: string, jobId: string) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "accepted" })
        .eq("id", applicationId);

      if (error) throw error;

      await supabase
        .from("jobs")
        .update({ status: "accepted", accepted_worker_id: workerId })
        .eq("id", jobId);

      toast({
        title: "Job accepted!",
        description: "You've accepted this job offer.",
      });

      if (workerId) fetchApplications(workerId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (applicationId: string, jobId: string) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "declined" })
        .eq("id", applicationId);

      if (error) throw error;

      await supabase
        .from("jobs")
        .update({ status: "declined" })
        .eq("id", jobId);

      toast({
        title: "Job declined",
        description: "You've declined this job offer.",
      });

      if (workerId) fetchApplications(workerId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "declined": return "bg-red-100 text-red-800";
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
          <h1 className="text-3xl font-bold">Worker Dashboard</h1>
          <Button onClick={() => navigate("/")} variant="outline">
            Home
          </Button>
        </div>

        <div className="grid gap-6">
          {applications.map((application) => (
            <Card key={application.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-primary" />
                      {application.jobs.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      from {application.jobs.profiles.full_name}
                    </p>
                    <Badge className={getStatusColor(application.status)}>
                      {application.status}
                    </Badge>
                  </div>
                  {application.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(application.id, application.jobs.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecline(application.id, application.jobs.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{application.jobs.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{application.jobs.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>${application.jobs.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{application.jobs.deadline_days} days deadline</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Required Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {application.jobs.skills_required.map((skill, idx) => (
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

        {applications.length === 0 && (
          <Card className="shadow-md">
            <CardContent className="py-12 text-center text-muted-foreground">
              No job offers yet. Check back later!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;
