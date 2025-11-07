import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Briefcase, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Worker {
  id: string;
  user_id: string;
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

const WorkerList = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from("workers")
        .select(`
          *,
          profiles (full_name),
          reviews (rating)
        `);

      if (error) throw error;
      setWorkers(data || []);
    } catch (error) {
      console.error("Error fetching workers:", error);
    } finally {
      setIsLoading(false);
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
        <p className="text-muted-foreground">Loading workers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Available Workers</h1>
          <Button onClick={() => navigate("/")} variant="outline">
            Back to Home
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workers.map((worker) => (
            <Card key={worker.id} className="shadow-md hover:shadow-lg transition-shadow">
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
              </CardContent>
            </Card>
          ))}
        </div>

        {workers.length === 0 && (
          <Card className="shadow-md">
            <CardContent className="py-12 text-center text-muted-foreground">
              No workers registered yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WorkerList;
