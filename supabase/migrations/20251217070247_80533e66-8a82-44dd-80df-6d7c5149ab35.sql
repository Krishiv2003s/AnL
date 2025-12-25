-- Add missing UPDATE and DELETE policies for analysis_insights table
CREATE POLICY "Users can update their own insights" 
ON public.analysis_insights 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights" 
ON public.analysis_insights 
FOR DELETE 
USING (auth.uid() = user_id);