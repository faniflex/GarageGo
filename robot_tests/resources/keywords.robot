*** Settings ***
Library    SeleniumLibrary
Variables  ../variables.robot

*** Keywords ***
Open Browser To Home
    [Arguments]
    Open Browser    ${BASE_URL}    ${BROWSER}
    Set Selenium Speed    0.1
    Wait Until Page Contains Element    xpath=//body    timeout=10s
