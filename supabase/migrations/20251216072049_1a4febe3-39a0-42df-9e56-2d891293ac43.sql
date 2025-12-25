-- Create enum for document types
CREATE TYPE public.document_type AS ENUM ('bank_statement', 'form_16', 'ledger', 'tax_return', 'other');

-- Create enum for account categories
CREATE TYPE public.account_category AS ENUM ('cash', 'credit_card', 'bank_transfer', 'investment', 'salary', 'loan', 'expense', 'income', 'other');

-- Create enum for asset_liability classification
CREATE TYPE public.asset_liability_type AS ENUM ('asset', 'liability', 'neutral');

-- Create documents table for uploaded files
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  document_type document_type NOT NULL DEFAULT 'other',
  file_size INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categorized_accounts table for transaction analysis
CREATE TABLE public.categorized_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  category account_category NOT NULL,
  total_credit DECIMAL(15,2) DEFAULT 0,
  total_debit DECIMAL(15,2) DEFAULT 0,
  net_balance DECIMAL(15,2) DEFAULT 0,
  is_taxable BOOLEAN DEFAULT false,
  classification asset_liability_type NOT NULL DEFAULT 'neutral',
  tax_implications TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analysis_insights table for AI-generated insights
CREATE TABLE public.analysis_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT,
  itr_form_suggestion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create balance_sheet table for generated balance sheets
CREATE TABLE public.balance_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_assets DECIMAL(15,2) DEFAULT 0,
  total_liabilities DECIMAL(15,2) DEFAULT 0,
  net_worth DECIMAL(15,2) DEFAULT 0,
  financial_year TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorized_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_sheets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Users can view their own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for categorized_accounts
CREATE POLICY "Users can view their own accounts" ON public.categorized_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own accounts" ON public.categorized_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for analysis_insights
CREATE POLICY "Users can view their own insights" ON public.analysis_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own insights" ON public.analysis_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for balance_sheets
CREATE POLICY "Users can view their own balance sheets" ON public.balance_sheets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own balance sheets" ON public.balance_sheets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for documents bucket
CREATE POLICY "Users can upload their own documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);