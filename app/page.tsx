"use client"

import type React from "react"

import dynamic from "next/dynamic"
import { useState, useCallback, useMemo } from "react"
import { parse, derivative, simplify } from "mathjs"

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

export default function Home() {
  const [n, setN] = useState(3)
  const [funcInput, setFuncInput] = useState("x^2")
  const [currentFunc, setCurrentFunc] = useState(funcInput)

  // 関数の定義
  const f = useCallback(
    (x: number) => {
      try {
        const node = parse(currentFunc)
        const compiled = node.compile()
        return compiled.evaluate({ x })
      } catch (error) {
        console.error("Error evaluating function:", error)
        return 0
      }
    },
    [currentFunc],
  )

  // fの微分関数
  const f_prime = useCallback(
    (x: number) => {
      try {
        const node = parse(currentFunc)
        const derived = derivative(node, "x")
        const compiled = derived.compile()
        return compiled.evaluate({ x })
      } catch (error) {
        console.error("Error evaluating derivative:", error)
        return 0
      }
    },
    [currentFunc],
  )

  // 微分後の関数の文字列表現
  const derivativeString = useMemo(() => {
    try {
      const node = parse(currentFunc)
      const derived = derivative(node, "x")
      return simplify(derived).toString()
    } catch (error) {
      console.error("Error calculating derivative:", error)
      return "Error"
    }
  }, [currentFunc])

  // 接線の関数
  const g = useCallback(
    (x: number, dot: number) => {
      const s = f_prime(dot)
      const t = f(dot) - s * dot
      return s * x + t
    },
    [f, f_prime],
  )

  // x値の生成 (-11 から 11)
  const x = Array.from({ length: 221 }, (_, i) => -11 + i * 0.1)

  // ドット値のリスト (-10 から 10)
  const dots = Array.from({ length: n }, (_, i) => Math.round(-10 + i * (20 / (n - 1))))

  // サブプロットの作成
  const rows = Math.ceil(n / 3)
  const cols = 3

  const data = dots.flatMap((dot, i) => [
    // f(x)のプロット
    {
      x: x,
      y: x.map(f),
      type: "scatter",
      mode: "lines",
      name: "f(x)",
      line: { color: "blue" },
      xaxis: `x${i + 1}`,
      yaxis: `y${i + 1}`,
    },
    // g(x)（接線）のプロット
    {
      x: x,
      y: x.map((xi) => g(xi, dot)),
      type: "scatter",
      mode: "lines",
      name: "Tangent",
      line: { color: "red" },
      xaxis: `x${i + 1}`,
      yaxis: `y${i + 1}`,
    },
    // f(dot)の点をプロット
    {
      x: [dot],
      y: [f(dot)],
      type: "scatter",
      mode: "markers",
      marker: { color: "red", size: 10 },
      xaxis: `x${i + 1}`,
      yaxis: `y${i + 1}`,
    },
  ])

  const layout = {
    grid: { rows, cols, pattern: "independent" },
    showlegend: false,
    width: 1200,
    height: 450 * rows, // グラフの高さを増やす
    margin: {
      l: 50,
      r: 50,
      b: 50,
      t: 80, // 上部のマージンを増やす
      pad: 4,
    },
    ...Object.fromEntries(
      dots.flatMap((dot, i) => [
        [
          `xaxis${i + 1}`,
          {
            title: "x",
            domain: [(i % 3) / 3 + 0.05, ((i % 3) + 1) / 3 - 0.05],
            range: [-11, 11],
            anchor: `y${i + 1}`,
          },
        ],
        [
          `yaxis${i + 1}`,
          {
            title: "y",
            domain: [1 - Math.floor(i / 3 + 1) / rows + 0.05, 1 - Math.floor(i / 3) / rows - 0.05],
            anchor: `x${i + 1}`,
          },
        ],
        [
          `annotations[${i * 2}]`,
          {
            text: `x = ${dot.toFixed(2)}`,
            xref: `x${i + 1}`,
            yref: `y${i + 1}`,
            x: 0.5,
            y: 1.12,
            showarrow: false,
            font: { size: 12, color: "black" },
          },
        ],
        [
          `annotations[${i * 2 + 1}]`,
          {
            text: `y = ${f_prime(dot).toFixed(2)}x + ${(f(dot) - f_prime(dot) * dot).toFixed(2)}`,
            xref: `x${i + 1}`,
            yref: `y${i + 1}`,
            x: 0.5,
            y: 1.05,
            showarrow: false,
            font: { size: 12, color: "red" },
          },
        ],
      ]),
    ),
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentFunc(funcInput)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold mb-8">Differential Graph</h1>
      <form onSubmit={handleSubmit} className="mb-4 flex flex-col items-center">
        <label htmlFor="func-input" className="mr-2 mb-2">
          Function f(x):
        </label>
        <div className="flex items-center">
          <input
            id="func-input"
            type="text"
            value={funcInput}
            onChange={(e) => setFuncInput(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 w-64 mr-2"
          />
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded">
            OK
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">Use JavaScript math syntax, e.g., sin(x), cos(x), exp(x), x^2</p>
      </form>
      <div className="mb-4">
        <label htmlFor="n-input" className="mr-2">
          Number of points:
        </label>
        <input
          id="n-input"
          type="number"
          value={n}
          onChange={(e) => setN(Math.max(2, Math.min(9, Number.parseInt(e.target.value) || 2)))}
          className="border border-gray-300 rounded px-2 py-1"
        />
      </div>
      <div className="mb-4 text-center">
        <p className="font-bold">Current function: f(x) = {currentFunc}</p>
        <p className="font-bold">Derivative: f'(x) = {derivativeString}</p>
      </div>
      <Plot data={data} layout={layout} config={{ responsive: true }} />
    </main>
  )
}

