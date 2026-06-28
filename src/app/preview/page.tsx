import { permanentRedirect } from "next/navigation";

export default function PreviewPage() {
  permanentRedirect("/raw");
}
