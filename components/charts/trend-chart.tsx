'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { BarChart3 } from 'lucide-react'

interface TrendData {
  timestamp: string
  value: number
  name: string
}

interface TrendChartProps {
  data: TrendData[]
  type: 'hashtags' | 'sounds' | 'creators'
}

export default function TrendChart({ data, type }: TrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove()

    const margin = { top: 30, right: 180, bottom: 60, left: 90 }
    const containerWidth = svgRef.current.parentElement?.clientWidth || 900
    const width = Math.max(containerWidth - margin.left - margin.right, 600)
    const height = 500 - margin.top - margin.bottom

    const svg = d3
      .select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Parse and process data
    const parseDate = (dateString: string) => {
      const date = new Date(dateString)
      return isNaN(date.getTime()) ? null : date
    }

    // Group data by name and sort by timestamp
    const groupedData = new Map<string, Array<{ date: Date; value: number }>>()
    
    data.forEach((d) => {
      const date = parseDate(d.timestamp)
      if (!date) return
      
      if (!groupedData.has(d.name)) {
        groupedData.set(d.name, [])
      }
      groupedData.get(d.name)!.push({ date, value: d.value })
    })

    // Sort each group by date and get top 10 by max value
    const sortedNames = Array.from(groupedData.entries())
      .map(([name, values]) => ({
        name,
        maxValue: d3.max(values, d => d.value) || 0,
        values: values.sort((a, b) => a.date.getTime() - b.date.getTime())
      }))
      .sort((a, b) => b.maxValue - a.maxValue)
      .slice(0, 10)

    if (sortedNames.length === 0) return

    // Get all dates for domain
    const allDates = sortedNames.flatMap(({ values }) => values.map(v => v.date))
    const allValues = sortedNames.flatMap(({ values }) => values.map(v => v.value))

    // Scales
    const x = d3
      .scaleTime()
      .domain(d3.extent(allDates) as [Date, Date])
      .range([0, width])

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(allValues) || 100])
      .nice()
      .range([height, 0])

    const color = d3
      .scaleOrdinal(d3.schemeCategory10)
      .domain(sortedNames.map(d => d.name))

    // Line generator with curve for smooth lines
    const line = d3
      .line<{ date: Date; value: number }>()
      .defined(d => !isNaN(d.value) && d.value >= 0)
      .x(d => x(d.date))
      .y(d => y(d.value))
      .curve(d3.curveCatmullRom.alpha(0.5))

    // Add gridlines
    svg
      .append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3
          .axisLeft(y)
          .tickSize(-width)
          .tickFormat(() => '')
      )

    // Add X axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(8).tickFormat(d3.timeFormat('%b %d')))
      .style('font-size', '11px')
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')

    // Add Y axis
    svg
      .append('g')
      .call(
        d3
          .axisLeft(y)
          .ticks(8)
          .tickFormat(d => d3.format('.2s')(d as number))
      )
      .style('font-size', '11px')

    // Add Y axis label
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left + 15)
      .attr('x', 0 - height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('font-weight', '600')
      .style('fill', 'currentColor')
      .text(type === 'hashtags' ? 'Views' : type === 'sounds' ? 'Video Uses' : 'Followers')

    // Draw lines for each trend
    sortedNames.forEach(({ name, values }, index) => {
      const lineColor = color(name) as string
      
      // Draw the line path
      const path = svg
        .append('path')
        .datum(values)
        .attr('fill', 'none')
        .attr('stroke', lineColor)
        .attr('stroke-width', 2.5)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', line)
        .attr('opacity', 0.85)
        .style('filter', 'drop-shadow(0px 2px 3px rgba(0,0,0,0.1))')

      // Animate line drawing
      const totalLength = path.node()?.getTotalLength() || 0
      path
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(1500)
        .ease(d3.easeQuadInOut)
        .attr('stroke-dashoffset', 0)

      // Add dots at data points
      svg
        .selectAll(`.dot-${index}`)
        .data(values)
        .enter()
        .append('circle')
        .attr('class', `dot-${index}`)
        .attr('cx', d => x(d.date))
        .attr('cy', d => y(d.value))
        .attr('r', 3.5)
        .attr('fill', lineColor)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('opacity', 0)
        .style('cursor', 'pointer')
        .transition()
        .delay(1500)
        .duration(500)
        .attr('opacity', 1)
    })

    // Add legend
    const legend = svg
      .selectAll('.legend')
      .data(sortedNames)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => `translate(${width + 15},${i * 24})`)
      .style('cursor', 'pointer')

    legend
      .append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 10)
      .attr('y2', 10)
      .attr('stroke', d => color(d.name) as string)
      .attr('stroke-width', 2.5)

    legend
      .append('circle')
      .attr('cx', 10)
      .attr('cy', 10)
      .attr('r', 3.5)
      .attr('fill', d => color(d.name) as string)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    legend
      .append('text')
      .attr('x', 26)
      .attr('y', 10)
      .attr('dy', '.35em')
      .style('font-size', '12px')
      .style('fill', 'currentColor')
      .text(d => d.name.length > 18 ? d.name.substring(0, 18) + '...' : d.name)

    // Tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'd3-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(15, 23, 42, 0.95)')
      .style('color', 'white')
      .style('padding', '12px 16px')
      .style('border-radius', '8px')
      .style('font-size', '13px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('box-shadow', '0 4px 6px rgba(0,0,0,0.3)')
      .style('z-index', '1000')

    svg
      .selectAll('circle')
      .on('mouseover', function (event, d: any) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 6)
        
        const valueName = type === 'hashtags' ? 'Views' : type === 'sounds' ? 'Uses' : 'Followers'
        tooltip.transition().duration(200).style('opacity', 1)
        tooltip
          .html(
            `<div style="font-weight: 600; margin-bottom: 6px;">${sortedNames[Math.floor(parseInt((this as SVGCircleElement).classList[0].split('-')[1]))].name}</div>` +
            `<div style="font-size: 12px; color: #94a3b8;">${d3.timeFormat('%B %d, %Y')(d.date)}</div>` +
            `<div style="margin-top: 6px; font-size: 14px;"><strong>${valueName}:</strong> ${d.value.toLocaleString()}</div>`
          )
          .style('left', event.pageX + 15 + 'px')
          .style('top', event.pageY - 40 + 'px')
      })
      .on('mouseout', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 3.5)
        
        tooltip.transition().duration(300).style('opacity', 0)
      })

    return () => {
      tooltip.remove()
    }
  }, [data, type])

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] border-2 border-dashed border-border rounded-lg">
        <div className="text-center">
          <BarChart3 className="mx-auto mb-2 text-muted-foreground" size={48} />
          <p className="text-muted-foreground">No trend data available</p>
          <p className="text-sm text-muted-foreground mt-1">Data will appear as trends are tracked</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      <svg ref={svgRef} className="w-full min-w-[600px]" style={{ minHeight: '500px' }} />
    </div>
  )
}
