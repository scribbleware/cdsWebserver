package org.pesc.web;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pesc.api.model.DirectoryUser;
import org.pesc.api.model.Message;
import org.pesc.api.model.MessageTopic;
import org.pesc.api.model.RegistrationForm;
import org.pesc.service.EmailService;
import org.pesc.service.MessageService;
import org.pesc.service.OrganizationService;
import org.pesc.api.repository.RolesRepository;
import org.pesc.api.repository.UserRepository;
import org.pesc.service.RegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.thymeleaf.context.WebContext;

import javax.mail.MessagingException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Collection;
import java.util.List;
import java.util.Locale;

/**
 * Created by james on 2/18/16.
 */

@Controller
public class AppController {

    private static final Log log = LogFactory.getLog(AppController.class);

    @Autowired
    private RegistrationService registrationService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private EmailService mailService;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private RolesRepository roleRepo;

    @Autowired
    private OrganizationService organizationService;

    private boolean buildUserModel(Model model) {
        boolean isAuthenticated = false;


        //Check if the user is autenticated
        if (SecurityContextHolder.getContext().getAuthentication() != null &&
                SecurityContextHolder.getContext().getAuthentication().isAuthenticated() &&
                //when Anonymous Authentication is enabled
                !(SecurityContextHolder.getContext().getAuthentication() instanceof AnonymousAuthenticationToken)) {

            User auth = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            Collection<GrantedAuthority> authorities = auth.getAuthorities();
            isAuthenticated = true;

            model.addAttribute("hasSystemAdminRole", hasRole(authorities, "ROLE_SYSTEM_ADMIN"));
            model.addAttribute("hasOrgAdminRole", hasRole(authorities, "ROLE_ORG_ADMIN"));

        }
        else {
            model.addAttribute("hasSystemAdminRole", false);
            model.addAttribute("hasOrgAdminRole", false);
        }

        model.addAttribute("roles", roleRepo.findAll() );
        model.addAttribute("organizationTypes", organizationService.getOrganizationTypes() );

        model.addAttribute("isAuthenticated", isAuthenticated);

        return isAuthenticated;

    }

    @RequestMapping(value="/",method = RequestMethod.GET)
    public String gotoHomePage(Model model){
        return "redirect:home";
    }

    @RequestMapping({"/organization"})
    public String getOrganizationFragment(Model model) {
        buildUserModel(model);

        return "fragments :: organization";
    }

    @RequestMapping({"/messages"})
    public String getMessagesFragment(Model model) {
        buildUserModel(model);

        return "fragments :: messages";
    }

    @RequestMapping({"/endpoint-selector"})
    public String getEndpointSelectorFragment(Model model) {
        buildUserModel(model);

        return "fragments :: endpoint-selector";
    }

    @RequestMapping({"/registration-form"})
    public String getRegistrationFormFragment(Model model) {

        return "fragments :: registration-form";
    }


    @RequestMapping({"/organization-details"})
    public String getOrganizationDetails(HttpServletRequest request, Model model) {

        //boolean isSystemAdmin = request.isUserInRole("ROLE_SYSTEM_ADMIN");

        //getUserDetails();

        buildUserModel(model);

        return "fragments :: organization-details";
    }

    @RequestMapping({"/user-details"})
    public String getUserDetails(HttpServletRequest request, Model model) {


        buildUserModel(model);

        return "fragments :: user-details";
    }


    @RequestMapping(value="/registration", method= RequestMethod.POST)
    @ResponseBody
    public Message createOrganization(HttpServletRequest request, HttpServletResponse response, @RequestBody RegistrationForm regForm)  {


        final WebContext ctx = new WebContext(request,response, request.getServletContext());

        registrationService.register(regForm.getOrganization(), regForm.getUser());

        try {
            final String content = mailService.createContent(ctx, "mail/registration", regForm.getOrganization(), regForm.getUser());

            mailService.sendSimpleMail(regForm.getUser().getEmail(), "noreply@edexchange.net", MessageTopic.REGISTRATION.getFriendlyName(), content);
            messageService.createMessage(MessageTopic.REGISTRATION.name(), content, false,regForm.getOrganization().getId(), null );


        }
        catch (MessagingException e) {
            log.error("Failed to send registration email.", e);
        }


        final String content = mailService.createContent(ctx, "mail/registration-admin", regForm.getOrganization(), regForm.getUser());

        Message regMessage = messageService.createMessage(MessageTopic.REGISTRATION.name(), content, true,2, null );


        return regMessage;

    }



    @RequestMapping({"/about"})
    public String getAboutPage(Model model) {

        buildUserModel(model);

        return "fragments :: about";
    }

    @RequestMapping({"/home", "/admin"})
    public String getHomePage(Model model) {

        if (buildUserModel(model) == true) {
            User auth = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            List<DirectoryUser> dirUser = userRepo.findByUserName(auth.getUsername());

            if (dirUser.size() == 1) {
                model.addAttribute("activeUser", dirUser.get(0));
            }
        }

        return "home";
    }


    @RequestMapping({"/organizations"})
    public String getOrganizationsTemplate(Model model) {
        buildUserModel(model);

        return "fragments :: organizations";
    }


    @RequestMapping({"/users"})
    public String getUsersTemplate(Model model) {
        buildUserModel(model);


        return "fragments :: users";
    }

    @RequestMapping({"/settings"})
    public String getSettingsFragment(Model model) {
        buildUserModel(model);


        return "fragments :: settings";
    }



    private void getUserDetails() {
        Object details = SecurityContextHolder.getContext().
                getAuthentication().getDetails();

        log.debug(details.toString());

    }

    private boolean hasRole(Collection<GrantedAuthority> authorities, String role) {
        boolean hasRole = false;
        for (GrantedAuthority authority : authorities) {
            hasRole = authority.getAuthority().equals(role);
            if (hasRole) {
                break;
            }
        }
        return hasRole;
    }



}