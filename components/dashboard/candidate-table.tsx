"use client"

import { useEffect, useMemo, useState } from "react"
import { loadCandidates } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"



type Row = {
  id: string
  name: string
  email: string
  total: number
  easy: number
  medium: number
  hard: number
  createdAt: number
}

export function CandidateTable() {
  const [query, setQuery] = useState("")
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    const list = loadCandidates()
    const mapped: Row[] = list.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      total: c.scores?.total ?? 0,
      easy: c.scores?.breakdown?.easy ?? 0,
      medium: c.scores?.breakdown?.medium ?? 0,
      hard: c.scores?.breakdown?.hard ?? 0,
      createdAt: typeof c.createdAt === 'string' ? Date.parse(c.createdAt) : c.createdAt,
    }))
    setRows(mapped.sort((a, b) => b.total - a.total))
  }, [])

  const filtered = useMemo(() => {
    if (!query) return rows
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.email.toLowerCase().includes(query.toLowerCase()),
    )
  }, [query, rows])

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-end justify-between gap-4">
          <div>
            <CardTitle>Candidates</CardTitle>
            <CardDescription>Sorted by score. Search by name/email.</CardDescription>
          </div>
          <Input
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-48"
          />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Easy</TableHead>
              <TableHead className="text-right">Medium</TableHead>
              <TableHead className="text-right">Hard</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-muted-foreground">{r.email}</TableCell>
                <TableCell className="text-right">{r.easy}</TableCell>
                <TableCell className="text-right">{r.medium}</TableCell>
                <TableCell className="text-right">{r.hard}</TableCell>
                <TableCell className="text-right font-semibold">{r.total}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No candidates yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
