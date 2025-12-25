-- Add missing UPDATE policy for balance_sheets table
CREATE POLICY "Users can update their own balance sheets" 
ON public.balance_sheets 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add missing DELETE policy for balance_sheets table
CREATE POLICY "Users can delete their own balance sheets" 
ON public.balance_sheets 
FOR DELETE 
USING (auth.uid() = user_id);