"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import Image from "next/image";
import { motion } from "framer-motion";

type Blog = {
  id: string;
  title: string;
  content: string;
  image?: string;
  author: string;
  readTime: number;
  createdAt: string;
};

export default function BlogsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page")) || 1;

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/blogs?page=${page}`);
        const data = await res.json();
        setBlogs(data.data || []);
        setTotalPages(data.metadata?.totalPages || 1);
        if (!res.ok) setError(true);
      } catch (err) {
        console.error("Error fetching blogs:", err);
        setBlogs([]);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, [page]);

  const goToPage = (newPage: number) => {
    router.push(`/blogs?page=${newPage}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-16 mt-20">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 text-gray-500">
            Failed to load blogs. Please try again later.
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {blogs.map((blog, index) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true }}
              >
                <Link href={`/blogs/blog?id=${blog.id}`}>
                  <div className="group bg-white border border-gray-200 rounded-xl overflow-hidden transform transition-all duration-300 hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-2 hover:shadow-xl">
                    {blog.image && (
                      <div className="relative w-full h-48 overflow-hidden">
                        <Image
                          src={blog.image}
                          alt={blog.title}
                          layout="fill"
                          objectFit="cover"
                          className="group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-gray-600 transition-colors duration-300 line-clamp-2">
                        {blog.title}
                      </h2>
                      <div className="flex items-center justify-between text-gray-600 text-sm">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          {blog.author}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {blog.readTime} min read
                        </span>
                      </div>
                      <div className="mt-4 text-gray-500 text-sm">{formatDate(blog.createdAt)}</div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <div className="flex items-center gap-4 bg-gray-50 px-6 py-3 rounded-lg border border-gray-200 shadow-sm">
              <Button
                className="bg-gray-50 text-white px-4 py-2 rounded hover:bg-gray-50 transition-all duration-300 disabled:bg-gray-50"
                disabled={page === 1}
                onClick={() => goToPage(page - 1)}
              >
                <PaginationPrevious />
              </Button>
              <span className="text-gray-900 px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                className="bg-gray-50 text-white px-4 py-2 rounded hover:bg-gray-50 transition-all duration-300 disabled:bg-gray-50"
                disabled={page === totalPages}
                onClick={() => goToPage(page + 1)}
              >
                <PaginationNext />
              </Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}