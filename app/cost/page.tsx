"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { 
  DollarSign, 
  Search, 
  Download, 
  AlertTriangle,
  ArrowUpDown, 
  Filter, 
  BarChart4,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  PlusCircle,
  LineChart,
  Clock,
  Calendar,
  Server,
  Database,
  Network,
  Layers,
  Wallet,
  Coins
} from "lucide-react"

export default function CostPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [currentTab, setCurrentTab] = React.useState("overview")
  const [timeframe, setTimeframe] = React.useState("30d")
  
  // Mock data - would come from API in a real application
  const costData = {
    summary: {
      currentMonth: 8456.32,
      previousMonth: 7890.45,
      forecastedMonth: 9120.75,
      ytd: 64890.23,
      trend: 7.1, // percentage change from previous month
      budget: 10000,
      budgetUtilization: 84.56,
      credits: 1200.00
    },
    services: [
      { 
        id: "compute-engine", 
        name: "Compute Engine", 
        icon: Server,
        cost: 3245.67,
        previousCost: 3102.45,
        trend: 4.6,
        forecastedCost: 3350.00,
        recommendations: 4,
        potentialSavings: 845.20
      },
      { 
        id: "cloud-storage", 
        name: "Cloud Storage", 
        icon: Database,
        cost: 1845.23,
        previousCost: 1756.78,
        trend: 5.0,
        forecastedCost: 1925.00,
        recommendations: 2,
        potentialSavings: 432.15
      },
      { 
        id: "cloudSQL", 
        name: "Cloud SQL", 
        icon: Database,
        cost: 1356.89,
        previousCost: 1245.67,
        trend: 8.9,
        forecastedCost: 1450.00,
        recommendations: 3,
        potentialSavings: 356.80
      },
      { 
        id: "network", 
        name: "Network Services", 
        icon: Network,
        cost: 952.34,
        previousCost: 865.45,
        trend: 10.0,
        forecastedCost: 975.00,
        recommendations: 1,
        potentialSavings: 125.45
      },
      { 
        id: "bigquery", 
        name: "BigQuery", 
        icon: Layers,
        cost: 745.20,
        previousCost: 687.32,
        trend: 8.4,
        forecastedCost: 780.00,
        recommendations: 3,
        potentialSavings: 234.80
      }
    ],
    recommendations: [
      {
        id: "rec-001",
        title: "Right-size over-provisioned VM instances",
        description: "5 VM instances are running with low CPU and memory utilization",
        service: "Compute Engine",
        impact: "high",
        estimatedSavings: 432.45,
        difficulty: "medium"
      },
      {
        id: "rec-002",
        title: "Delete unattached persistent disks",
        description: "3 persistent disks are not attached to any VM instances",
        service: "Compute Engine",
        impact: "medium",
        estimatedSavings: 87.65,
        difficulty: "low"
      },
      {
        id: "rec-003",
        title: "Enable object lifecycle management for storage buckets",
        description: "2 storage buckets contain older objects that could be archived or deleted",
        service: "Cloud Storage",
        impact: "medium",
        estimatedSavings: 156.32,
        difficulty: "low"
      },
      {
        id: "rec-004",
        title: "Convert standard storage to nearline for infrequently accessed data",
        description: "Several buckets contain data that is rarely accessed",
        service: "Cloud Storage",
        impact: "medium",
        estimatedSavings: 224.78,
        difficulty: "low"
      },
      {
        id: "rec-005",
        title: "Optimize BigQuery queries to reduce data scanned",
        description: "Several queries are processing excessive amounts of data",
        service: "BigQuery",
        impact: "high",
        estimatedSavings: 198.45,
        difficulty: "high"
      }
    ]
  }
  
  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-red-500";
    if (trend < 0) return "text-emerald-500";
    return "text-slate-500";
  }
  
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30";
      case "medium":
        return "text-amber-500 bg-amber-100 dark:bg-amber-900/30";
      case "low":
        return "text-blue-500 bg-blue-100 dark:bg-blue-900/30";
      default:
        return "text-slate-500 bg-slate-100 dark:bg-slate-900/30";
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cost Management</h2>
          <p className="text-muted-foreground mt-1">Monitor and optimize your cloud spending</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" 
              className={`h-8 ${timeframe === "30d" ? "bg-muted" : ""}`}
              onClick={() => setTimeframe("30d")}>
              30 Days
            </Button>
            <Button variant="outline" size="sm" 
              className={`h-8 ${timeframe === "90d" ? "bg-muted" : ""}`}
              onClick={() => setTimeframe("90d")}>
              90 Days
            </Button>
            <Button variant="outline" size="sm" 
              className={`h-8 ${timeframe === "ytd" ? "bg-muted" : ""}`}
              onClick={() => setTimeframe("ytd")}>
              YTD
            </Button>
          </div>
          <Button variant="outline" className="h-9 flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="premium-card">
          <CardContent className="p-4">
            <div className="flex flex-col space-y-2">
              <div className="text-sm text-muted-foreground">Current Month</div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold">${costData.summary.currentMonth.toLocaleString()}</span>
                <span className={`text-xs font-medium ${getTrendColor(costData.summary.trend)}`}>
                  {costData.summary.trend > 0 ? '+' : ''}{costData.summary.trend}%
                </span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground space-x-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>vs. last month (${costData.summary.previousMonth.toLocaleString()})</span>
              </div>
              <div className="mt-1 h-1.5 bg-muted rounded-full">
                <div className="h-1.5 bg-primary rounded-full" style={{ width: `${costData.summary.budgetUtilization}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{costData.summary.budgetUtilization}% of budget</span>
                <span>Target: ${costData.summary.budget.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="premium-card">
          <CardContent className="p-4">
            <div className="flex flex-col space-y-2">
              <div className="text-sm text-muted-foreground">Forecasted</div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold">${costData.summary.forecastedMonth.toLocaleString()}</span>
                {costData.summary.forecastedMonth > costData.summary.budget ? (
                  <span className="text-xs font-medium text-red-500">Over budget</span>
                ) : (
                  <span className="text-xs font-medium text-emerald-500">Under budget</span>
                )}
              </div>
              <div className="flex items-center text-xs text-muted-foreground space-x-1">
                <TrendingUp className={`h-3.5 w-3.5 ${costData.summary.forecastedMonth > costData.summary.currentMonth ? "text-red-500" : "text-emerald-500"}`} />
                <span>End of month estimate</span>
              </div>
              <div className="mt-1 h-1.5 bg-muted rounded-full">
                <div 
                  className={`h-1.5 rounded-full ${costData.summary.forecastedMonth > costData.summary.budget ? "bg-red-500" : "bg-emerald-500"}`} 
                  style={{ width: `${(costData.summary.forecastedMonth / costData.summary.budget) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {costData.summary.forecastedMonth > costData.summary.budget ? (
                    <>
                      ${(costData.summary.forecastedMonth - costData.summary.budget).toLocaleString()} over
                    </>
                  ) : (
                    <>
                      ${(costData.summary.budget - costData.summary.forecastedMonth).toLocaleString()} under
                    </>
                  )}
                </span>
                <span>Budget: ${costData.summary.budget.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="premium-card">
          <CardContent className="p-4">
            <div className="flex flex-col space-y-2">
              <div className="text-sm text-muted-foreground">Year to Date</div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold">${costData.summary.ytd.toLocaleString()}</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground space-x-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>January 1 - Today</span>
              </div>
              <div className="mt-1 flex items-center justify-center h-8">
                <LineChart className="h-8 w-full text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="premium-card">
          <CardContent className="p-4">
            <div className="flex flex-col space-y-2">
              <div className="text-sm text-muted-foreground">Potential Savings</div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-emerald-500">
                  ${costData.recommendations.reduce((acc, rec) => acc + rec.estimatedSavings, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground space-x-1">
                <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
                <span>{costData.recommendations.length} optimization opportunities</span>
              </div>
              <div className="mt-1 grid grid-cols-5 gap-1 h-1.5">
                {costData.recommendations.map((rec, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full ${
                      rec.impact === "high" ? "bg-emerald-500" : 
                      rec.impact === "medium" ? "bg-amber-500" : 
                      "bg-blue-500"
                    }`} 
                  ></div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Based on current usage patterns</span>
                <Link href="#recommendations" className="text-primary">
                  View All
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="premium-card">
        <CardHeader className="pb-3">
          <CardTitle>Cost Analysis</CardTitle>
          <CardDescription>
            Analyze and track your cloud spending by service
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="overview" className="px-4 sm:px-6" onValueChange={setCurrentTab}>
          <div className="overflow-x-auto">
            <TabsList className="w-full justify-start border-b pb-px mb-4">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="services" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                By Service
              </TabsTrigger>
              <TabsTrigger 
                value="recommendations" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                id="recommendations"
              >
                Recommendations
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="m-0">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="mb-4">
                  <h3 className="text-lg font-medium">Cost Trend</h3>
                  <p className="text-sm text-muted-foreground">Daily spending for the last 30 days</p>
                </div>
                
                <div className="relative h-80 border rounded-md bg-muted/20 flex items-center justify-center">
                  <div className="space-y-2 text-center">
                    <BarChart4 className="h-10 w-10 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground text-sm">Daily spending chart visualization</p>
                    <Button variant="outline" size="sm">Interactive View</Button>
                  </div>
                </div>
              </div>
              
              <div className="w-full lg:w-96">
                <div className="mb-4">
                  <h3 className="text-lg font-medium">Cost Distribution</h3>
                  <p className="text-sm text-muted-foreground">Current month by service</p>
                </div>
                
                <div className="space-y-4">
                  {costData.services.map((service, idx) => {
                    const ServiceIcon = service.icon;
                    const percentage = (service.cost / costData.summary.currentMonth) * 100;
                    
                    return (
                      <div key={service.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <ServiceIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{service.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">${service.cost.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full">
                          <div 
                            className={`h-1.5 rounded-full ${
                              idx === 0 ? "bg-primary" :
                              idx === 1 ? "bg-blue-500" :
                              idx === 2 ? "bg-emerald-500" :
                              idx === 3 ? "bg-amber-500" :
                              "bg-purple-500"
                            }`} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="pt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>Spending over time</span>
                      <span>Last 7 days</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 h-8">
                      {[65, 70, 55, 80, 95, 75, 85].map((height, idx) => (
                        <div key={idx} className="bg-muted/50 rounded-sm relative">
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-primary rounded-sm" 
                            style={{ height: `${height}%` }}
                          ></div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="services" className="m-0">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Service</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="h-10 px-2 text-right font-medium">Current Month</th>
                      <th className="h-10 px-2 text-right font-medium">Previous Month</th>
                      <th className="h-10 px-2 text-center font-medium">Trend</th>
                      <th className="h-10 px-2 text-right font-medium">Forecasted</th>
                      <th className="h-10 px-2 text-right font-medium">Potential Savings</th>
                      <th className="h-10 px-2 text-center font-medium">Recommendations</th>
                      <th className="h-10 px-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costData.services.map((service) => {
                      const ServiceIcon = service.icon;
                      
                      return (
                        <tr key={service.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <ServiceIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{service.name}</span>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-right">${service.cost.toLocaleString()}</td>
                          <td className="px-2 py-3 text-right">${service.previousCost.toLocaleString()}</td>
                          <td className="px-2 py-3 text-center">
                            <div className="flex items-center justify-center">
                              {service.trend > 0 ? (
                                <TrendingUp className={`h-4 w-4 ${getTrendColor(service.trend)}`} />
                              ) : (
                                <TrendingDown className={`h-4 w-4 ${getTrendColor(service.trend)}`} />
                              )}
                              <span className={`ml-1 text-xs ${getTrendColor(service.trend)}`}>
                                {service.trend > 0 ? '+' : ''}{service.trend}%
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-right">${service.forecastedCost.toLocaleString()}</td>
                          <td className="px-2 py-3 text-right text-emerald-500">
                            {service.potentialSavings > 0 ? `$${service.potentialSavings.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-2 py-3 text-center">
                            {service.recommendations > 0 ? (
                              <div className="flex items-center justify-center">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                  {service.recommendations}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-2 py-3 text-right">
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                              Details
                              <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="recommendations" className="m-0">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Cost Optimization Recommendations</h3>
                <p className="text-sm text-muted-foreground">Implement these recommendations to reduce your cloud costs</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button className="h-9">
                  Apply All
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              {costData.recommendations.map((rec) => {
                const ServiceIcon = costData.services.find(s => s.name === rec.service)?.icon || Server;
                
                return (
                  <Card key={rec.id} className="overflow-hidden border-l-4 border-l-primary">
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6">
                      <div className="col-span-1 md:col-span-3 lg:col-span-4 p-4">
                        <div className="flex items-start space-x-4">
                          <div className={`rounded-full p-2 mt-0.5 ${getImpactColor(rec.impact)}`}>
                            <ServiceIcon className={`h-4 w-4 ${getImpactColor(rec.impact).split(" ")[0]}`} />
                          </div>
                          <div>
                            <div className="font-medium">{rec.title}</div>
                            <div className="text-sm text-muted-foreground mt-1">{rec.description}</div>
                            <div className="flex items-center space-x-3 mt-3">
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                <Wallet className="h-3.5 w-3.5" />
                                <span>{rec.service}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getImpactColor(rec.impact)}`}>
                                  {rec.impact} impact
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                <Coins className="h-3.5 w-3.5" />
                                <span>Est. savings: ${rec.estimatedSavings.toLocaleString()}/month</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-1 md:col-span-1 lg:col-span-2 bg-muted/20 flex items-center justify-end p-4 border-t md:border-t-0 md:border-l">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">View Details</Button>
                          <Button size="sm">Apply Now</Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
} 