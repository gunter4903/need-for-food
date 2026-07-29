package com.needforfood.service;

import com.needforfood.exception.custom.InvalidImageFileException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class RecipeImageStorageService {

    private static final Map<String, String> EXTENSIONS_BY_CONTENT_TYPE = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp");

    private static final String PUBLIC_PATH_PREFIX = "/uploads/recipes/";

    private final Path recipesDir;
    private final String baseUrl;

    public RecipeImageStorageService(@Value("${app.upload-dir}") String uploadDir,
                                      @Value("${app.base-url}") String baseUrl) {
        this.recipesDir = Paths.get(uploadDir, "recipes").toAbsolutePath();
        this.baseUrl = baseUrl;
    }

    public String store(MultipartFile file) {
        String extension = EXTENSIONS_BY_CONTENT_TYPE.get(file.getContentType());
        if (extension == null) {
            throw new InvalidImageFileException(
                    "Type de fichier non autorisé (formats acceptés : JPEG, PNG, WebP)");
        }
        if (file.isEmpty()) {
            throw new InvalidImageFileException("Fichier vide");
        }

        String filename = UUID.randomUUID() + extension;

        try {
            Files.createDirectories(recipesDir);
            file.transferTo(recipesDir.resolve(filename));
        } catch (IOException e) {
            throw new InvalidImageFileException("Impossible d'enregistrer l'image : " + e.getMessage());
        }

        return baseUrl + PUBLIC_PATH_PREFIX + filename;
    }

    public void delete(String url) {
        if (url == null || !url.startsWith(baseUrl + PUBLIC_PATH_PREFIX)) {
            return;
        }

        String filename = url.substring((baseUrl + PUBLIC_PATH_PREFIX).length());
        try {
            Files.deleteIfExists(recipesDir.resolve(filename));
        } catch (IOException e) {
            log.warn("Échec de la suppression du fichier image {} : {}", filename, e.getMessage());
        }
    }
}
