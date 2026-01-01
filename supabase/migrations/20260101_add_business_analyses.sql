-- Create a table for saved business analyses
create table if not exists public.business_analyses (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    analysis_type text not null,
    model_name text not null,
    results jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.business_analyses enable row level security;

-- Create policies
create policy "Users can view their own analyses"
    on public.business_analyses for select
    using (auth.uid() = user_id);

create policy "Users can insert their own analyses"
    on public.business_analyses for insert
    with check (auth.uid() = user_id);

create policy "Users can delete their own analyses"
    on public.business_analyses for delete
    using (auth.uid() = user_id);
