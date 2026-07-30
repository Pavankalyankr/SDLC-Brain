"use client";

/**
 * SDLC Brain — Project Overview Page
 *
 * Shows project details, memory, recent activity, and module status.
 */

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  Upload,
  ClipboardList,
  Network,
  Code2,
  TestTube2,
  BookOpen,
  GitPullRequest,
  Container,
  Server,
  ArrowRight,
  Brain,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileUpload } from "@/components/shared/file-upload";
import { cn } from "@/lib/utils";
import { documentApi } from "@/lib/api";
import { toast } from "sonner";

const moduleStatus = [
  { name: "Requirements", icon: ClipboardList, status: "not_started", count: 0 },
  { name: "Architecture", icon: Network, status: "not_started", count: 0 },
  { name: "Development", icon: Code2, status: "not_started", count: 0 },
  { name: "QA & Testing", icon: TestTube2, status: "not_started", count: 0 },
  { name: "Knowledge", icon: BookOpen, status: "not_started", count: 0 },
  { name: "Code Review", icon: GitPullRequest, status: "not_started", count: 0 },
  { name: "DevOps", icon: Container, status: "not_started", count: 0 },
  { name: "Production", icon: Server, status: "not_started", count: 0 },
];

export default function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    documentApi.list(id).then((docs: any) => setDocuments(docs)).catch(console.error);
  }, [id]);

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);
    
    try {
      // Upload the first file for MVP
      const file = files[0];
      const promise = documentApi.upload(id, file);
      
      toast.promise(promise, {
        loading: `Uploading ${file.name}...`,
        success: (data) => {
          setDocuments((prev) => [...prev, data]);
          return `Successfully uploaded ${file.name}`;
        },
        error: "Failed to upload document",
      });
      
      await promise;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Project Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">
            E-Commerce Platform
          </h1>
          <p className="text-sm text-[var(--foreground-secondary)] mt-1">
            Full-stack e-commerce platform with microservices architecture
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="gap-1 bg-[var(--success-muted)] text-[var(--success)] border-0 text-xs">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column — SOW Upload + Workflow */}
        <div className="col-span-2 space-y-6">
          {/* SOW Upload */}
          <Card className="border-[var(--border)] bg-[var(--background-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <Upload className="h-4 w-4 text-[var(--primary)]" />
                Upload Statement of Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg bg-[var(--background)] border border-[var(--border)] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-[var(--primary)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">{doc.filename}</p>
                          <p className="text-[10px] text-[var(--foreground-secondary)]">{new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge className="bg-[var(--success-muted)] text-[var(--success)] border-0">Ready</Badge>
                    </div>
                  ))}
                  <div className="pt-2">
                    <p className="text-xs text-[var(--foreground-secondary)] mb-2">Upload additional documents:</p>
                    <FileUpload onUpload={handleUpload} className={isUploading ? "opacity-50 pointer-events-none" : ""} />
                  </div>
                </div>
              ) : (
                <FileUpload onUpload={handleUpload} className={isUploading ? "opacity-50 pointer-events-none" : ""} />
              )}
            </CardContent>
          </Card>

          {/* Module Status Grid */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">
              Module Progress
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {moduleStatus.map((mod) => {
                const moduleHref = `/projects/${id}/${mod.name.toLowerCase().replace(/\s&\s/g, "-").replace(/\s/g, "-")}`;
                return (
                  <Link key={mod.name} href={moduleHref}>
                    <Card className="border-[var(--border)] bg-[var(--background-card)] card-hover group">
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--background-elevated)]">
                          <mod.icon className="h-4 w-4 text-[var(--foreground-secondary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[var(--foreground)] truncate">
                            {mod.name}
                          </p>
                          <p className="text-[10px] text-[var(--foreground-tertiary)]">
                            {mod.count} artifacts
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[var(--foreground-tertiary)] opacity-0 transition-opacity group-hover:opacity-100" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column — Project Memory */}
        <div className="space-y-6">
          {/* Project Memory */}
          <Card className="border-[var(--border)] bg-[var(--background-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <Brain className="h-4 w-4 text-[var(--primary)]" />
                Project Memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-xs text-[var(--foreground-tertiary)] italic">
                  No memory entries yet. Memory is automatically updated when you approve artifacts.
                </p>
                <Separator className="bg-[var(--border)]" />
                <div className="space-y-2">
                  {[
                    { key: "Backend", value: "Not set" },
                    { key: "Frontend", value: "Not set" },
                    { key: "Database", value: "Not set" },
                    { key: "Architecture", value: "Not set" },
                  ].map((entry) => (
                    <div
                      key={entry.key}
                      className="flex items-center justify-between rounded-lg bg-[var(--background)] px-3 py-2"
                    >
                      <span className="text-xs text-[var(--foreground-secondary)]">
                        {entry.key}
                      </span>
                      <span className="text-xs text-[var(--foreground-tertiary)]">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SDLC Workflow */}
          <Card className="border-[var(--border)] bg-[var(--background-card)]">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-[var(--foreground)]">
                Workflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { step: "Upload SOW", done: false },
                  { step: "Generate Requirements", done: false },
                  { step: "Approve Requirements", done: false },
                  { step: "Generate Architecture", done: false },
                  { step: "Generate Code", done: false },
                  { step: "Generate Tests", done: false },
                  { step: "Code Review", done: false },
                  { step: "DevOps Setup", done: false },
                ].map((item, i) => (
                  <div
                    key={item.step}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-xs",
                      item.done
                        ? "bg-[var(--success-muted)] text-[var(--success)]"
                        : i === 0
                        ? "bg-[var(--primary-muted)] text-[var(--primary)]"
                        : "bg-[var(--background)] text-[var(--foreground-tertiary)]"
                    )}
                  >
                    <div
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        item.done
                          ? "bg-[var(--success)]"
                          : i === 0
                          ? "bg-[var(--primary)]"
                          : "bg-[var(--foreground-tertiary)]"
                      )}
                    />
                    {item.step}
                    {item.done && <CheckCircle2 className="h-3 w-3 ml-auto" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
