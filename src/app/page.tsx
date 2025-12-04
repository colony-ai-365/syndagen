import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/configs");
  return null;
}
