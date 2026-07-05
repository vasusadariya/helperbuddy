'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BlogCard } from './blog-card';
import { Pagination } from './pagination';
import { Blog } from '@prisma/client';

const PAGE_SIZE = 10;
console.log(PAGE_SIZE);
export const BlogFeed = () => {
	const searchParams = useSearchParams();
	const page = Number(searchParams.get('page')) || 1;

	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [metadata, setMetadata] = useState({ totalPages: 1, hasNextPage: false });

	useEffect(() => {
		const fetchBlogs = async () => {
			try {
				const res = await fetch(`/api/blogs?page=${page}`);
				const { data, metadata } = await res.json();
				setBlogs(data || []);
				setMetadata(metadata || { totalPages: 1, hasNextPage: false });
			} catch (err) {
				console.error("Error fetching blogs:", err);
				setBlogs([]);
			}
		};

		fetchBlogs();
	}, [page]);

	return (
		<div className="space-y-6 p-6">
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{blogs.map((blog) => (
					<BlogCard key={blog.id} {...blog} />
				))}
			</div>

			<Pagination {...metadata} />

		</div>
	);
};
