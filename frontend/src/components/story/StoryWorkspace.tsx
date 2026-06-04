import React from "react";
import { useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import jsPDF from "jspdf";

import { RootState } from "../../redux/store";
import { getUserInfo } from "../../services/auth.service";

import ChapterSidebar from "./ChapterSidebar";
import StoryViewer from "./StoryViewer";
import ContinueStoryButton from "./ContinueStoryButton";

const StoryWorkspace = () => {
  const currentStory = useSelector(
    (state: RootState) => state.story.currentStory
  );

  const handleExportMarkdown = () => {
    if (!currentStory) {
      toast.error("No story available to export.");
      return;
    }
    try {
      const title = currentStory.title || "Story";
      const user = getUserInfo();
      const authorName = user?.name || "Anonymous";
      const isoDate = new Date().toISOString().split("T")[0];
      
      let chaptersContent = "";
      if (currentStory.chapters && currentStory.chapters.length > 0) {
        currentStory.chapters.forEach((chapter) => {
          chaptersContent += `## ${chapter.title}\n\n${chapter.content}\n\n`;
        });
      } else {
        chaptersContent = "*No chapters in this story.*";
      }

      const markdownContent = `---\ntitle: "${title.replace(/"/g, '\\"')}"\nauthor: "${authorName.replace(/"/g, '\\"')}"\ndate: "${isoDate}"\n---\n\n# ${title}\n\n${chaptersContent}`;
      const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      link.setAttribute("download", `${cleanTitle || "story"}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Markdown downloaded!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export Markdown.");
    }
  };

  const handleExportPDF = () => {
    if (!currentStory) {
      toast.error("No story available to export.");
      return;
    }
    const toastId = toast.loading("Preparing your PDF...");
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const title = currentStory.title || "Story";
      const leftMargin = 20;
      const rightMargin = 20;
      const topMargin = 20;
      const bottomMargin = 20;
      const printableWidth = 210 - leftMargin - rightMargin; // 170 mm
      const maxY = 297 - bottomMargin - 10;
      let yCursor = topMargin;

      // Draw Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241);
      doc.text("StorySparkAI", leftMargin, yCursor + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("WORKSPACE STORY DRAFT", 190, yCursor + 5, { align: "right" });
      yCursor += 12;

      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.5);
      doc.line(leftMargin, yCursor, 190, yCursor);
      yCursor += 10;

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59);
      const splitTitle = doc.splitTextToSize(title, printableWidth);
      splitTitle.forEach((line: string) => {
        doc.text(line, leftMargin, yCursor);
        yCursor += 9;
      });
      yCursor += 5;

      const formattedDate = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on ${formattedDate}`, leftMargin, yCursor);
      yCursor += 10;

      // Content
      if (currentStory.chapters && currentStory.chapters.length > 0) {
        currentStory.chapters.forEach((chapter, index) => {
          // Chapter Header
          if (yCursor + 15 > maxY) {
            doc.addPage();
            yCursor = topMargin + 10;
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(99, 102, 241);
          doc.text(chapter.title || `Chapter ${index + 1}`, leftMargin, yCursor);
          yCursor += 8;

          // Chapter Content
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.setTextColor(30, 41, 59);

          const paragraphs = (chapter.content || "").split(/\n+/);
          paragraphs.forEach((para: string, pIdx: number) => {
            const cleanPara = para.trim();
            if (!cleanPara) return;
            const lines = doc.splitTextToSize(cleanPara, printableWidth);
            lines.forEach((line: string) => {
              if (yCursor > maxY) {
                doc.addPage();
                yCursor = topMargin + 10;
              }
              doc.text(line, leftMargin, yCursor);
              yCursor += 6.5;
            });
            if (pIdx < paragraphs.length - 1) {
              yCursor += 4.5;
            }
          });

          yCursor += 8; // spacing between chapters
        });
      } else {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(11);
        doc.setTextColor(100, 116, 139);
        doc.text("No chapters in this story.", leftMargin, yCursor);
      }

      // Add page numbers
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.25);
        doc.line(leftMargin, 280, 190, 280);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("Generated with StorySparkAI Workspace", leftMargin, 285);
        doc.text(`Page ${i} of ${totalPages}`, 190, 285, { align: "right" });
      }

      const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      doc.save(`${cleanTitle || "story"}.pdf`);
      toast.success("PDF downloaded!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export PDF.");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleExportDOCX = () => {
    if (!currentStory) {
      toast.error("No story available to export.");
      return;
    }
    try {
      const title = currentStory.title || "Story";
      const user = getUserInfo();
      const authorName = user?.name || "Anonymous";
      
      const escapeHtml = (value: string): string =>
        value
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");

      let chaptersHtml = "";
      if (currentStory.chapters && currentStory.chapters.length > 0) {
        currentStory.chapters.forEach((chapter, index) => {
          const chTitle = chapter.title || `Chapter ${index + 1}`;
          const chContent = chapter.content || "";
          const paragraphs = chContent
            .split(/\n+/)
            .map((paragraph) => `<p>${escapeHtml(paragraph.trim())}</p>`)
            .join("");
          chaptersHtml += `<h2>${escapeHtml(chTitle)}</h2>${paragraphs}<br/>`;
        });
      } else {
        chaptersHtml = "<p><i>No chapters in this story.</i></p>";
      }

      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #111827; }
    h1 { color: #312e81; }
    h2 { color: #4f46e5; margin-top: 20px; }
    .meta { color: #64748b; font-size: 12px; margin-bottom: 24px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">Author: ${escapeHtml(authorName)} | Date: ${new Date().toLocaleDateString()}</div>
  ${chaptersHtml}
</body>
</html>`;

      const blob = new Blob([html], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      link.setAttribute("download", `${cleanTitle || "story"}.docx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("DOCX downloaded!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export DOCX.");
    }
  };

  if (!currentStory) {
    return (
      <div className="text-white p-10">
        No Story Available
      </div>
    );
  }

  return (
    <div className="flex bg-black h-screen">
      <Toaster position="top-right" reverseOrder={false} />
      <ChapterSidebar
        chapters={currentStory.chapters}
      />

      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-900">
          <h2 className="text-white text-lg font-bold">{currentStory.title}</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportMarkdown}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition flex items-center gap-2 font-semibold cursor-pointer text-sm"
            >
              ⬇️ Markdown
            </button>
            <button
              onClick={handleExportPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow transition flex items-center gap-2 font-semibold cursor-pointer text-sm"
            >
              ⬇️ PDF
            </button>
            <button
              onClick={handleExportDOCX}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition flex items-center gap-2 font-semibold cursor-pointer text-sm"
            >
              ⬇️ Word (DOCX)
            </button>
          </div>
        </div>

        <StoryViewer
          chapters={currentStory.chapters}
        />

        <div className="p-6 border-t border-zinc-800">
          <ContinueStoryButton />
        </div>
      </div>
    </div>
  );
};

export default StoryWorkspace;