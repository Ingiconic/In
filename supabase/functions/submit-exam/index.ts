import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema
const submitExamSchema = z.object({
  examQuestions: z.array(z.object({
    question: z.string().max(1000),
    options: z.array(z.string().max(500)).max(10),
    correct_answer: z.number().int().min(0),
    explanation: z.string().max(1000).optional(),
  })).min(1).max(100),
  userAnswers: z.array(z.number().int()).min(1).max(100),
  examTitle: z.string().min(1).max(200),
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the JWT and get user - pass the token explicitly
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    
    // Validate input
    const validation = submitExamSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'ورودی نامعتبر', details: validation.error.issues }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { examQuestions, userAnswers, examTitle } = validation.data;

    // SERVER-SIDE VALIDATION - cannot be tampered with
    let correctCount = 0;
    examQuestions.forEach((question, idx) => {
      if (userAnswers[idx] === question.correct_answer) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / examQuestions.length) * 100);
    
    // Calculate points on server (secure)
    let pointsAwarded = 10 + correctCount;
    if (percentage >= 100) {
      pointsAwarded += 10;
    } else if (percentage >= 80) {
      pointsAwarded += 5;
    }

    console.log(`User ${user.id} completed exam: ${correctCount}/${examQuestions.length} correct, ${pointsAwarded} points`);

    // Save exam record
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .insert({
        user_id: user.id,
        title: examTitle || `آزمون ${new Date().toLocaleDateString('fa-IR')}`,
        questions: examQuestions,
        answers: userAnswers,
        score: percentage,
        points_awarded: pointsAwarded,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (examError) {
      console.error('Error saving exam:', examError);
      return new Response(
        JSON.stringify({ error: 'Failed to save exam' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Award points using SECURITY DEFINER function
    const { error: pointsError } = await supabase.rpc('award_exam_points', {
      points_to_award: pointsAwarded,
      exam_id_param: examData.id,
    });

    if (pointsError) {
      console.error('Error awarding points:', pointsError);
      return new Response(
        JSON.stringify({ error: 'Failed to award points' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully awarded ${pointsAwarded} points to user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        score: percentage, 
        pointsAwarded,
        correctCount,
        totalQuestions: examQuestions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in submit-exam function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
