"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Generate consistent data with a realistic pattern
const generateRealisticData = () => {
  const baseValues = [2100, 4800, 1600, 1800, 1400, 2700, 4200, 3300, 4500, 3400, 2900, 2400]
  
  return [
    { name: "Jan", total: baseValues[0] },
    { name: "Feb", total: baseValues[1] },
    { name: "Mar", total: baseValues[2] },
    { name: "Apr", total: baseValues[3] },
    { name: "May", total: baseValues[4] },
    { name: "Jun", total: baseValues[5] },
    { name: "Jul", total: baseValues[6] },
    { name: "Aug", total: baseValues[7] },
    { name: "Sep", total: baseValues[8] },
    { name: "Oct", total: baseValues[9] },
    { name: "Nov", total: baseValues[10] },
    { name: "Dec", total: baseValues[11] },
  ]
}

export function Overview() {
  const data = React.useMemo(() => generateRealisticData(), [])

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis 
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          padding={{ left: 10, right: 10 }}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
          width={60}
        />
        <Tooltip 
          cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          contentStyle={{ borderRadius: '6px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', border: 'none' }}
          formatter={(value) => [`$${value}`, 'Spend']}
        />
        <Bar
          dataKey="total"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
          barSize={30}
        />
      </BarChart>
    </ResponsiveContainer>
  )
} 