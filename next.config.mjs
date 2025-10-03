/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images-bonnier.imgix.net",
      },
    ],
  },
};

export default nextConfig;

