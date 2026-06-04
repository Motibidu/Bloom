package com.starterkit.domain.checkin.controller;

import com.starterkit.domain.checkin.dto.response.CheckinResponse;
import com.starterkit.domain.checkin.service.CheckinService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/share/checkin")
@RequiredArgsConstructor
public class OgController {

    private final CheckinService checkinService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @GetMapping(value = "/{id}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> shareCheckin(@PathVariable("id") Long id) {
        CheckinResponse c;
        try {
            c = checkinService.getPublicById(id);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }

        String title = escapeHtml(c.title());
        String description = c.description() != null && !c.description().isBlank()
                ? escapeHtml(c.description())
                : escapeHtml(c.nickname() + "님의 활동을 확인해보세요!");
        String imageUrl = (c.photoUrls() != null && !c.photoUrls().isEmpty())
                ? c.photoUrls().get(0)
                : "";
        String pageUrl = frontendUrl + "/share/checkin/" + id;

        String html = """
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>%s</title>
                  <meta property="og:type" content="article" />
                  <meta property="og:site_name" content="오늘 뭐 했어요?" />
                  <meta property="og:title" content="%s" />
                  <meta property="og:description" content="%s" />
                  <meta property="og:url" content="%s" />
                  %s
                  <meta name="twitter:card" content="%s" />
                  <meta name="twitter:title" content="%s" />
                  <meta name="twitter:description" content="%s" />
                  %s
                  <script>location.replace("%s");</script>
                </head>
                <body></body>
                </html>
                """.formatted(
                title,
                title,
                description,
                pageUrl,
                imageUrl.isBlank() ? "" : "<meta property=\"og:image\" content=\"" + imageUrl + "\" />",
                imageUrl.isBlank() ? "summary" : "summary_large_image",
                title,
                description,
                imageUrl.isBlank() ? "" : "<meta name=\"twitter:image\" content=\"" + imageUrl + "\" />",
                pageUrl
        );

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(html);
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
