*** Settings ***
Documentation     Smoke: Cart page loads
Resource          ../resources/keywords.robot
Library           SeleniumLibrary
Suite Setup       Open Browser To Home
Suite Teardown    Close Browser

*** Test Cases ***
Cart Page Loads
    [Documentation]    Open cart page and verify body exists
    Go To    ${BASE_URL}/cart
    Wait Until Page Contains Element    xpath=//body    timeout=10s
    Page Should Contain Element    xpath=//body
