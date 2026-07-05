'use client';

import { useState, useEffect } from 'react';
import { SingleImageDropzone } from '@/components/SingleImageDropzone';
import { useEdgeStore } from '@/lib/edgestore';
interface Blog {
    id: string;
    title: string;
    content: string;
    image?: string;
    author: string;
    readTime: number;
    createdAt: string;
}

export default function AdminBlogManager() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [author, setAuthor] = useState('');
    const [readTime, setReadTime] = useState<number>(5);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    const [loadingBlogs, setLoadingBlogs] = useState<boolean>(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
    const { edgestore } = useEdgeStore();

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        setLoadingBlogs(true);
        try {
            const res = await fetch('/api/admin/blogs');
            const data = await res.json();
            setBlogs(data);
        } catch (error) {
            console.error('Error fetching blogs:', error);
        } finally {
            setLoadingBlogs(false);
        }
    };

    const resetForm = () => {
        setEditingBlog(null);
        setTitle('');
        setContent('');
        setAuthor('');
        setReadTime(5);
        setFile(null);
    };

    const handleEditClick = (blog: Blog) => {
        setEditingBlog(blog);
        setTitle(blog.title);
        setContent(blog.content);
        setAuthor(blog.author);
        setReadTime(blog.readTime);
        setFile(null);
    };

    const handleSubmitBlog = async () => {
        if (!title || !content || !author || (!editingBlog && !file)) {
            return alert('Please fill all required fields');
        }

        setUploading(true);
        let imageUrl = editingBlog?.image || '';

        try {
            if (file) {
                const res = await edgestore.publicFiles.upload({
                    file,
                    options: {
                        temporary: true,
                    }
                });
                imageUrl = res.url;
            }

            const res = await fetch('/api/admin/blogs', {
                method: editingBlog ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    editingBlog
                        ? { id: editingBlog.id, title, content, image: imageUrl, readTime }
                        : { title, content, image: imageUrl, author, readTime }
                ),
            });

            if (res.ok) {
                fetchBlogs();
                resetForm();
                if (file) {
                    edgestore.publicFiles.confirmUpload({ url: imageUrl });
                }
                if (file && editingBlog?.image && editingBlog.image !== imageUrl) {
                    await fetch('/api/edgestore/delete', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: editingBlog.image }),
                    });
                }
            } else {
                alert(editingBlog ? 'Failed to update blog' : 'Failed to create blog');
            }
        } catch (error) {
            console.error('Error saving blog:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteBlog = async (id: string, image?: string) => {
        if (!confirm('Are you sure?')) return;
    
        setDeletingId(id);
    
        try {
            if (image) {
                await fetch('/api/edgestore/delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: image }),
                });
                console.log('Image deleted successfully');
            }
    
            const res = await fetch('/api/admin/blogs', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
    
            if (res.ok) {
                setBlogs((prev) => prev.filter((blog) => blog.id !== id));
            } else {
                const errorData = await res.json();
                alert(`Failed to delete blog: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting blog:', error);
        } finally {
            setDeletingId(null);
        }
    };
    

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold mb-4">Admin - Manage Blogs</h1>

            {/* Create Blog Form */}
            <div className="space-y-4">
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title" className="w-full p-2 border rounded" />
                <textarea value={content} onChange={(e) => setContent(e.target.value)}
                    placeholder="Content" className="w-full p-2 border rounded"></textarea>
                <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Author" className="w-full p-2 border rounded" />
                <input type="number" value={readTime} onChange={(e) => setReadTime(Number(e.target.value))}
                    placeholder="Read Time (min)" className="w-full p-2 border rounded" />

                <SingleImageDropzone
                    width={200}
                    height={200}
                    value={file}
                    onChange={(file) => setFile(file ?? null)}
                />
                {editingBlog?.image && !file && (
                    <p className="text-xs text-gray-500">Leave image empty to keep the current one.</p>
                )}

                <div className="flex gap-2">
                    <button onClick={handleSubmitBlog} disabled={uploading} className="bg-black text-white px-4 py-2 rounded flex-1">
                        {uploading ? 'Saving...' : editingBlog ? 'Update Blog' : 'Create Blog'}
                    </button>
                    {editingBlog && (
                        <button onClick={resetForm} className="bg-gray-200 text-gray-800 px-4 py-2 rounded">
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* Blog List */}
            <h2 className="text-xl font-bold mt-6 mb-2">Existing Blogs</h2>
            
            {loadingBlogs ? (
                <p className="text-gray-500">Loading blogs...</p>
            ) : blogs.length === 0 ? (
                <p className="text-gray-500">No blogs found.</p>
            ) : (
                <ul className="space-y-4">
                    {blogs.map((blog) => (
                        <li key={blog.id} className="p-4 border rounded-lg flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold">{blog.title}</h3>
                                <p className="text-gray-600 text-sm">{blog.author} - {blog.readTime} min read</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditClick(blog)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteBlog(blog.id, blog.image)}
                                    disabled={deletingId === blog.id}
                                    className="bg-red-500 text-white px-3 py-1 rounded"
                                >
                                    {deletingId === blog.id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
