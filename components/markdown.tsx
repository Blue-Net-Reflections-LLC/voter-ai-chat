import Link from 'next/link';
import React, { memo, useLayoutEffect, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../styles/table-styles.css';

const NonMemoizedMarkdown = ({ children, streaming = true }: { children: string, streaming: boolean }) => {
	const [initialized, setInitialized] = useState<boolean>(false);
	useLayoutEffect(() => {
		if (!initialized && !streaming) {
			setInitialized(true)
		}
	}, [streaming])
  const components: Partial<Components> = {
    // @ts-expect-error

    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        // @ts-expect-error
        <pre
          {...props}
          className={`${className} text-sm w-[80dvw] md:max-w-[500px] overflow-x-scroll bg-zinc-100 p-3 rounded-lg mt-2 dark:bg-zinc-800`}
        >
          <code className={match[1]}>{children}</code>
        </pre>
      ) : (
        <code
          className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md`}
          {...props}
        >
          {children}
        </code>
      );
    },
    ol: ({ node, children, ...props }) => {
      return (
        <ol className="list-decimal list-outside ml-4" {...props}>
          {children}
        </ol>
      );
    },
    li: ({ node, children, ...props }) => {
      return (
        <li className="py-1" {...props}>
          {children}
        </li>
      );
    },
    ul: ({ node, children, ...props }) => {
      return (
        <ul className="list-decimal list-outside ml-4" {...props}>
          {children}
        </ul>
      );
    },
    strong: ({ node, children, ...props }) => {
      return (
        <span className="font-semibold" {...props}>
          {children}
        </span>
      );
    },
		img: ({ node, children, ...props }) => {
			return (
				<span className="font-semibold overflow-x-clip">
          <img {...props} aria-label="A Generated AI Creation" />
        </span>
			);
		},
    a: ({ node, children, ...props }) => {
      return initialized ?  (
				<a {...props}>{children}</a>
				// TODO::  We need to add this back.
				// <Link
        //   className="text-blue-500 hover:underline"
        //   target="_blank"
        //   rel="noreferrer"
        //   {...props}
        // >
        //   {children}
				// </Link>
      ) : (
				"processing...."
			);
    },
    h1: ({ node, children, ...props }) => {
      return (
        <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ node, children, ...props }) => {
      return (
        <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ node, children, ...props }) => {
      return (
        <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
          {children}
        </h3>
      );
    },
    h4: ({ node, children, ...props }) => {
      return (
        <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
          {children}
        </h4>
      );
    },
    h5: ({ node, children, ...props }) => {
      return (
        <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
          {children}
        </h5>
      );
    },
    h6: ({ node, children, ...props }) => {
      return (
        <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
          {children}
        </h6>
      );
    },
		table: ({ node, children, ...props }) => {
			return (
				<div className="styled-table">
					<table {...props}>
						{children}
					</table>
				</div>
			);
		},
  };
	// if (!initialized) {
	// 	return <div>Waiit....</div>
	// }
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children && prevProps.streaming === nextProps.streaming,
);
