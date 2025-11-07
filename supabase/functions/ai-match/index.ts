import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobId } = await req.json();

    if (!jobId) {
      throw new Error("Job ID is required");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) throw jobError;

    // Fetch all workers with their profiles and reviews
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select(`
        *,
        profiles (full_name),
        reviews (rating)
      `);

    if (workersError) throw workersError;

    // AI Matching Algorithm
    const matchedWorkers = workers.map((worker: any) => {
      let score = 0;

      // Skill matching: +10 points per matching skill
      const jobSkills = job.skills_required.map((s: string) => s.toLowerCase());
      const workerSkills = worker.skills.map((s: string) => s.toLowerCase());
      const matchingSkills = jobSkills.filter((skill: string) => 
        workerSkills.some((ws: string) => ws.includes(skill) || skill.includes(ws))
      );
      score += matchingSkills.length * 10;

      // Location matching: +20 points if same location
      if (worker.location.toLowerCase().includes(job.location.toLowerCase()) ||
          job.location.toLowerCase().includes(worker.location.toLowerCase())) {
        score += 20;
      }

      // Experience bonus: +5 points per year of experience
      score += worker.experience * 5;

      // Average rating bonus: +10 points for high ratings
      if (worker.reviews.length > 0) {
        const avgRating = worker.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / worker.reviews.length;
        score += Math.round(avgRating * 2);
      }

      return {
        ...worker,
        matchScore: score
      };
    });

    // Sort by match score and take top 3
    const topMatches = matchedWorkers
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, 3);

    return new Response(
      JSON.stringify({ matches: topMatches }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-match function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
