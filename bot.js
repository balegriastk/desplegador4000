// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, CardFactory } = require('botbuilder');
// The accessor names for the conversation data and user profile state property accessors.
const CONVERSATION_DATA_PROPERTY = 'conversationData';
const USER_PROFILE_PROPERTY = 'userProfile';

const DeployCard = require('./cards/deployCard.json');


class EchoBot extends ActivityHandler {
    constructor(conversationState, userState) {
        super();
        // Create the state property accessors for the conversation data and user profile.
        this.conversationData = conversationState.createProperty(CONVERSATION_DATA_PROPERTY);
        this.userProfile = userState.createProperty(USER_PROFILE_PROPERTY);

        // The state management objects for the conversation and user state.
        this.conversationState = conversationState;
        this.userState = userState;
        this.onMessage(async (turnContext, next) => {
            const userProfile = await this.userProfile.get(turnContext, {});
            const conversationData = await this.conversationData.get(
                turnContext, { promptedForUserName: false });


            await EchoBot.deployBuilder(conversationData, userProfile, turnContext);

            if(turnContext.activity.text == '!deploy')
            await turnContext.sendActivity({ attachments: [this.createAdaptiveCard()] });

            await next();
        });

        this.onMembersAdded(async (turnContext, next) => {
            const membersAdded = turnContext.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== turnContext.activity.recipient.id) {
                    await turnContext.sendActivity('Hello and welcome!');
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onDialog(async (turnContext, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(turnContext, false);
            await this.userState.saveChanges(turnContext, false);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
    createAdaptiveCard() {
        return CardFactory.adaptiveCard(DeployCard);
    }

    static async deployBuilder(conversationData, userProfile, turnContext) {
        if(turnContext.activity.value)
        {
            const url = turnContext.activity.value.urlId;
            const ext = turnContext.activity.value.extensionId;
            const inst = turnContext.activity.value.instanciaId;
            const lugar = turnContext.activity.value.lugarId;

            var backup = `cp /usr/local/jboss/server/${ inst }/${ lugar }/${ ext } /home/admin/backups/${ lugar }/`;
            var download = `wget --user=rpalacios --password=rpalacios123 -O /home/admin/Deploy/app/${ ext } ${ url }`;
            var deploy = `cp /home/admin/Deploy/app/${ ext } /usr/local/jboss/server/${ inst }/${ lugar }/`
            
            await turnContext.sendActivity(`/** RESPALDAR ARTEFACTO**/`);
            await turnContext.sendActivity(`${ backup }`);
            await turnContext.sendActivity(`/* DESCARGAR ARTEFACTO CON WGET */`);
            await turnContext.sendActivity(`${ download }`);
            await turnContext.sendActivity(`/** DESPLIEGUE DEL ARTEFACTO **/`);
            await turnContext.sendActivity(`${ deploy }`);

        }


    }
}

module.exports.EchoBot = EchoBot;
