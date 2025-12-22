interface BannerProps {
  title?: string;
  subtitle?: string;
}

export default function Banner({
  title = "Build Your Future With Us",
  subtitle = "MyPlatform.",
}: BannerProps) {
  return (
    <section className="bg-primary text-white py-5">
      <div className="container text-center">
        <h1 className="fw-bold mb-3">{title}</h1>
        <p className="lead mb-5">{subtitle}</p>
      </div>
    </section>
  );
}
