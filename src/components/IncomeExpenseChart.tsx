import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, PieChart as PieIcon, BarChart3, Activity } from 'lucide-react';

interface AccountData {
  category: string;
  classification: string;
  net_balance: number | null;
  account_name: string;
}

interface IncomeExpenseChartProps {
  accounts: AccountData[];
}

export function IncomeExpenseChart({ accounts }: IncomeExpenseChartProps) {
  // Calculate income and expenses from accounts
  const incomeCategories = ['salary', 'income', 'investment'];
  const expenseCategories = ['expense', 'loan'];
  
  const incomeData = accounts
    .filter(acc => incomeCategories.includes(acc.category) || acc.classification === 'asset')
    .reduce((sum, acc) => sum + Math.abs(acc.net_balance || 0), 0);
  
  const expenseData = accounts
    .filter(acc => expenseCategories.includes(acc.category) || acc.classification === 'liability')
    .reduce((sum, acc) => sum + Math.abs(acc.net_balance || 0), 0);

  // Pie chart data
  const pieData = [
    { name: 'Income', value: incomeData, color: 'hsl(145, 70%, 45%)' },
    { name: 'Expenses', value: expenseData, color: 'hsl(0, 75%, 55%)' },
  ];

  // Category breakdown for bar chart
  const categoryBreakdown = accounts.reduce((acc, item) => {
    const category = item.category;
    const existing = acc.find(a => a.category === category);
    if (existing) {
      existing.amount += Math.abs(item.net_balance || 0);
    } else {
      acc.push({
        category: category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' '),
        amount: Math.abs(item.net_balance || 0),
        isIncome: incomeCategories.includes(category) || item.classification === 'asset'
      });
    }
    return acc;
  }, [] as { category: string; amount: number; isIncome: boolean }[]);

  // Monthly trend data (simulated based on accounts)
  const monthlyTrend = [
    { month: 'Jan', income: incomeData * 0.8, expenses: expenseData * 0.9 },
    { month: 'Feb', income: incomeData * 0.85, expenses: expenseData * 0.85 },
    { month: 'Mar', income: incomeData * 0.9, expenses: expenseData * 0.95 },
    { month: 'Apr', income: incomeData * 0.95, expenses: expenseData * 0.8 },
    { month: 'May', income: incomeData * 1.0, expenses: expenseData * 0.9 },
    { month: 'Jun', income: incomeData * 1.1, expenses: expenseData * 1.0 },
  ];

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toFixed(0)}`;
  };

  const netFlow = incomeData - expenseData;
  const isPositive = netFlow >= 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
          <p className="text-foreground font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (accounts.length === 0) {
    return null;
  }

  return (
    <Card className="ticker-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Financial Overview
          </CardTitle>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isPositive ? 'bg-profit/20' : 'bg-loss/20'}`}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-profit" />
            ) : (
              <TrendingDown className="h-4 w-4 text-loss" />
            )}
            <span className={`digital-value text-sm font-bold ${isPositive ? 'profit-indicator' : 'loss-indicator'}`}>
              {isPositive ? '+' : ''}{formatCurrency(netFlow)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
              <PieIcon className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
              <BarChart3 className="h-4 w-4" />
              Breakdown
            </TabsTrigger>
            <TabsTrigger value="trend" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
              <Activity className="h-4 w-4" />
              Trend
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Stats Cards */}
              <div className="flex flex-col justify-center gap-4">
                <div className="p-4 rounded-xl bg-profit/10 border border-profit/30">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Total Income</span>
                    <TrendingUp className="h-5 w-5 text-profit" />
                  </div>
                  <p className="digital-value text-2xl font-bold profit-indicator mt-1">
                    {formatCurrency(incomeData)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-loss/10 border border-loss/30">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Total Expenses</span>
                    <TrendingDown className="h-5 w-5 text-loss" />
                  </div>
                  <p className="digital-value text-2xl font-bold loss-indicator mt-1">
                    {formatCurrency(expenseData)}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="mt-0">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBreakdown} layout="vertical">
                  <XAxis 
                    type="number" 
                    tickFormatter={formatCurrency}
                    stroke="hsl(200, 60%, 75%)"
                    fontSize={12}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="category" 
                    width={80}
                    stroke="hsl(200, 60%, 75%)"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="amount" 
                    radius={[0, 4, 4, 0]}
                    animationBegin={0}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isIncome ? 'hsl(145, 70%, 45%)' : 'hsl(0, 75%, 55%)'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="trend" className="mt-0">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(145, 70%, 45%)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(145, 70%, 45%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 75%, 55%)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(0, 75%, 55%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(200, 60%, 75%)"
                    fontSize={12}
                  />
                  <YAxis 
                    tickFormatter={formatCurrency}
                    stroke="hsl(200, 60%, 75%)"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="hsl(145, 70%, 45%)"
                    strokeWidth={2}
                    fill="url(#incomeGradient)"
                    animationBegin={0}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="hsl(0, 75%, 55%)"
                    strokeWidth={2}
                    fill="url(#expenseGradient)"
                    animationBegin={300}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
