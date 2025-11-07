import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Briefcase, 
  Users, 
  Sparkles, 
  LogOut, 
  UserPlus, 
  FileText,
  LayoutDashboard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({ workers: 0, jobs: 0 });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    fetchStats();

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setUserProfile(data);
  };

  const fetchStats = async () => {
    const { count: workersCount } = await supabase
      .from("workers")
      .select("*", { count: "exact", head: true });
    
    const { count: jobsCount } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true });

    setStats({
      workers: workersCount || 0,
      jobs: jobsCount || 0,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    setUser(null);
    setUserProfile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="bg-gradient-primary text-primary-foreground py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-5xl font-bold mb-4 animate-fade-in">SmartHire</h1>
          <p className="text-xl text-primary-foreground/90 mb-8 animate-fade-in">
            AI-Powered Job & Worker Management System
          </p>
          
          {user && userProfile && (
            <div className="animate-fade-in">
              <p className="text-lg mb-4">
                Welcome back, <span className="font-semibold">{userProfile.full_name}</span>!
              </p>
              <Button 
                onClick={handleLogout}
                variant="secondary"
                size="lg"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          )}

          {!user && (
            <Button 
              onClick={() => navigate("/auth")}
              size="lg"
              variant="secondary"
              className="gap-2 animate-fade-in"
            >
              Get Started
            </Button>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-6xl mx-auto px-4 -mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-foreground" />
                </div>
                Total Workers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{stats.workers}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary-foreground" />
                </div>
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{stats.jobs}</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions Section */}
        {user && userProfile && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userProfile.user_type === "employer" && (
                <>
                  <Button
                    onClick={() => navigate("/job-post")}
                    className="h-auto py-6 flex-col gap-3"
                    variant="outline"
                  >
                    <FileText className="w-8 h-8" />
                    <span className="text-lg">Post a Job</span>
                  </Button>
                  <Button
                    onClick={() => navigate("/worker-list")}
                    className="h-auto py-6 flex-col gap-3"
                    variant="outline"
                  >
                    <Users className="w-8 h-8" />
                    <span className="text-lg">Browse Workers</span>
                  </Button>
                  <Button
                    onClick={() => navigate("/employer-dashboard")}
                    className="h-auto py-6 flex-col gap-3"
                    variant="outline"
                  >
                    <LayoutDashboard className="w-8 h-8" />
                    <span className="text-lg">My Dashboard</span>
                  </Button>
                </>
              )}

              {userProfile.user_type === "worker" && (
                <>
                  <Button
                    onClick={() => navigate("/worker-register")}
                    className="h-auto py-6 flex-col gap-3"
                    variant="outline"
                  >
                    <UserPlus className="w-8 h-8" />
                    <span className="text-lg">Complete Profile</span>
                  </Button>
                  <Button
                    onClick={() => navigate("/worker-dashboard")}
                    className="h-auto py-6 flex-col gap-3"
                    variant="outline"
                  >
                    <LayoutDashboard className="w-8 h-8" />
                    <span className="text-lg">My Dashboard</span>
                  </Button>
                  <Button
                    onClick={() => navigate("/worker-list")}
                    className="h-auto py-6 flex-col gap-3"
                    variant="outline"
                  >
                    <Users className="w-8 h-8" />
                    <span className="text-lg">View All Workers</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {!user && (
          <Card className="shadow-lg mb-12">
            <CardContent className="py-12 text-center">
              <h3 className="text-2xl font-bold mb-4">Get Started Today</h3>
              <p className="text-muted-foreground mb-6">
                Sign up as an employer to post jobs or as a worker to find opportunities
              </p>
              <Button onClick={() => navigate("/auth")} size="lg">
                Sign Up Now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
