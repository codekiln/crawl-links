import { describe, it, expect } from "vitest";
import type { Root, Element } from "hast";
import { VFile } from "vfile";
import type { BuildCtx } from "@quartz-community/types";
import type { FullSlug } from "@quartz-community/utils";
import { CrawlLinks } from "../src/transformer";

function linkFrom(fileSlug: string, href: string, allSlugs: string[]): Element {
  const link: Element = {
    type: "element",
    tagName: "a",
    properties: { href },
    children: [{ type: "text", value: "link" }],
  };
  const tree: Root = { type: "root", children: [link] };
  const plugin = CrawlLinks({ markdownLinkResolution: "relative" });
  const ctx = { allSlugs } as unknown as BuildCtx;
  const factory = plugin.htmlPlugins!(ctx)[0] as () => (tree: Root, file: VFile) => void;
  const file = new VFile();
  file.data.slug = fileSlug as FullSlug;
  factory()(tree, file);
  return tree.children[0] as Element;
}

describe("relative strategy", () => {
  const allSlugs = [
    "meta/entities/person",
    "apps/gallery/index",
    "apps/gallery/notes",
    "people/brent-benson/index",
    "index",
  ];
  const page = "apps/gallery/index";

  it("resolves a ../ Markdown link against the page's folder", () => {
    const link = linkFrom(page, "../../People/Brent%20Benson/Brent%20Benson.md", allSlugs);
    expect(link.properties["data-slug"]).toBe("people/brent-benson/index");
  });

  it("resolves a same-folder Markdown link against the page's folder", () => {
    const link = linkFrom(page, "Notes.md", allSlugs);
    expect(link.properties["data-slug"]).toBe("apps/gallery/notes");
  });

  it("resolves a link to a folder note from inside its folder", () => {
    const link = linkFrom(
      "people/brent-benson/apps/browser/index",
      "../../Brent%20Benson.md",
      allSlugs,
    );
    expect(link.properties["data-slug"]).toBe("people/brent-benson/index");
  });

  it("falls back to shortest for a full-path wikilink", () => {
    const link = linkFrom(page, "Meta/Entities/Person", allSlugs);
    expect(link.properties["data-slug"]).toBe("meta/entities/person");
  });

  it("falls back to shortest for a bare wikilink", () => {
    const link = linkFrom(page, "Person", allSlugs);
    expect(link.properties["data-slug"]).toBe("meta/entities/person");
  });
});
