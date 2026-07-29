package com.needforfood.service;

import com.needforfood.model.entity.Ingredient;
import com.needforfood.model.entity.PreparationStep;
import com.needforfood.model.entity.Recipe;
import com.needforfood.model.entity.RecipeImage;
import com.needforfood.model.entity.RecipeIngredient;
import com.needforfood.model.entity.User;
import com.needforfood.repository.sql.UserRepository;
import com.needforfood.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class AuthService {

    private static final String INVALID_CREDENTIALS_MESSAGE = "Email ou mot de passe incorrect";
    private static final String WELCOME_RECIPE_IMAGE_PATH = "/images/pates-au-beurre.png";

    private final UserRepository userRepository;
    private final UserService userService;
    private final RecipeService recipeService;
    private final ShoppingListService shoppingListService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final String baseUrl;

    public AuthService(UserRepository userRepository,
                        UserService userService,
                        RecipeService recipeService,
                        ShoppingListService shoppingListService,
                        EmailService emailService,
                        PasswordEncoder passwordEncoder,
                        JwtTokenProvider jwtTokenProvider,
                        @Value("${app.base-url}") String baseUrl) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.recipeService = recipeService;
        this.shoppingListService = shoppingListService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.baseUrl = baseUrl;
    }

    @Transactional
    public User register(String email, String username, String rawPassword) {
        User user = userService.register(email, username, rawPassword);

        Recipe welcomeRecipe = recipeService.createRecipe(user.getId(), welcomeRecipe());
        shoppingListService.generateFromRecipes(user.getId(), "Liste de bienvenue", List.of(welcomeRecipe.getId()));

        emailService.sendVerificationCode(user.getEmail(), user.getUsername(), user.getVerificationCode());

        return user;
    }

    @Transactional
    public String verifyAccount(String email, String code) {
        User user = userService.verifyAccount(email, code);
        return jwtTokenProvider.generateToken(user.getId(), user.getEmail());
    }

    @Transactional
    public void resendVerificationCode(String email) {
        User user = userService.getByEmail(email);
        if (user.isVerified()) {
            return;
        }
        String code = userService.regenerateVerificationCode(email);
        emailService.sendVerificationCode(user.getEmail(), user.getUsername(), code);
    }

    private Recipe welcomeRecipe() {
        List<RecipeIngredient> ingredients = new ArrayList<>(List.of(
                RecipeIngredient.builder()
                        .ingredient(Ingredient.builder().name("Pâtes").unit("g").build())
                        .quantity(200f)
                        .build(),
                RecipeIngredient.builder()
                        .ingredient(Ingredient.builder().name("Beurre").unit("g").build())
                        .quantity(20f)
                        .build(),
                RecipeIngredient.builder()
                        .ingredient(Ingredient.builder().name("Sel").unit("g").build())
                        .quantity(5f)
                        .build()
        ));

        List<PreparationStep> steps = new ArrayList<>(List.of(
                PreparationStep.builder().description("Faites bouillir une grande casserole d'eau salée.").build(),
                PreparationStep.builder().description("Plongez les pâtes et faites-les cuire selon le temps indiqué sur le paquet.").build(),
                PreparationStep.builder().description("Égouttez, ajoutez le beurre, mélangez et dégustez !").build()
        ));

        List<RecipeImage> images = new ArrayList<>(List.of(
                RecipeImage.builder().url(baseUrl + WELCOME_RECIPE_IMAGE_PATH).build()
        ));

        return Recipe.builder()
                .title("Pâtes au beurre (recette de bienvenue)")
                .description("Une recette d'exemple pour découvrir Need for Food. Modifiez-la ou supprimez-la comme vous le souhaitez !")
                .difficulty("Facile")
                .preparationTime(10)
                .ingredients(ingredients)
                .steps(steps)
                .images(images)
                .type("Plat")
                .build();
    }

    @Transactional(readOnly = true)
    public String login(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException(INVALID_CREDENTIALS_MESSAGE));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new BadCredentialsException(INVALID_CREDENTIALS_MESSAGE);
        }

        return jwtTokenProvider.generateToken(user.getId(), user.getEmail());
    }
}
