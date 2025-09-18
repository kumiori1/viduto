import React from 'react';
import { Link } from 'react-router-dom';

export default function PostCard({ post }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <img
        src={post.image}
        alt={post.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {post.title}
        </h3>
        <p className="text-gray-600 mb-4">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {new Date(post.published_at).toLocaleDateString()}
          </span>
          <Link
            to={post.slug ? `/blogpost?slug=${post.slug}` : `/blogpost?id=${post.id}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Read More
          </Link>
        </div>
      </div>
    </div>
  );
}