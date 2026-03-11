import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const { auth, kv, fs } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated) navigate('/auth?next=/');
  }, [auth.isAuthenticated]);

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);
      const resumes = (await kv.list('resume:*', true)) as KVItem[];
      const parsedResumes = resumes?.map((resume) => (
          JSON.parse(resume.value) as Resume
      ));
      setResumes(parsedResumes || []);
      setLoadingResumes(false);
    };
    loadResumes();
  }, []);

  const handleWipe = async () => {
    const confirmed = window.confirm('Are you sure you want to delete all resumes? This cannot be undone.');
    if (!confirmed) return;

    const files = await fs.readDir('./') as FSItem[];
    files?.forEach(async (file) => {
      await fs.delete(file.path);
    });
    await kv.flush();
    setResumes([]);
  };

  return (
      <main className="bg-[url('/images/bg-main.svg')] bg-cover">
        <Navbar />

        <section className="main-section">
          <div className="page-heading py-16">
            <h1>Track Your Applications & Resume Ratings</h1>
            {!loadingResumes && resumes?.length === 0 ? (
                <h2>No resumes found. Upload your first resume to get feedback.</h2>
            ) : (
                <h2>Review your submissions and check AI-powered feedback.</h2>
            )}
          </div>

          {/* Wipe button — only shows when resumes exist */}
          {!loadingResumes && resumes.length > 0 && (
              <div className="flex justify-end px-4 mb-4">
                <button
                    onClick={handleWipe}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  🗑️ Wipe All Resumes
                </button>
              </div>
          )}

          {loadingResumes && (
              <div className="flex flex-col items-center justify-center">
                <img src="/images/resume-scan-2.gif" className="w-[200px]" />
              </div>
          )}

          {!loadingResumes && resumes.length > 0 && (
              <div className="resumes-section">
                {resumes.map((resume) => (
                    <ResumeCard key={resume.id} resume={resume} />
                ))}
              </div>
          )}

          {!loadingResumes && resumes?.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-10 gap-4">
                <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
                  Upload Resume
                </Link>
              </div>
          )}
        </section>
      </main>
  );
}