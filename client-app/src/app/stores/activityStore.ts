import {observable, action, computed, configure, runInAction} from 'mobx';
import { createContext, SyntheticEvent } from 'react';
import { IActivity } from '../models/activity';
import agent from '../api/agent';

configure({enforceActions: 'always'});

class ActivityStore {
    @observable activityResgistry = new Map();
    @observable activities: IActivity[] = [];
    @observable selectedActivity: IActivity | undefined;
    @observable loadingInitial = false;
    @observable editMode =false;
    @observable submitting = false;
    @observable target ='';

    @computed get activitiesByDate() {
        return Array.from(this.activityResgistry.values()).sort(
        (a, b) => Date.parse(a.date) - Date.parse(b.date)
        );
    }

    @action loadActivities = async () => {
        this.loadingInitial = true;
        try {
        const activities = await agent.Activities.list();
        runInAction('loading activities',() => {
            activities.forEach((activity) => {
                activity.date = activity.date.split(".")[0];
                this.activityResgistry.set(activity.id, activity);
            });
            this.loadingInitial = false;
        })
            
        } catch (error) {
            runInAction('load activities error',() => {
                this.loadingInitial = false;
            })
            console.log(error);
            
        }
    };

    @action createActivity = async (activity: IActivity) => {
        this.submitting = true;
        try{
            await agent.Activities.create(activity);
            runInAction('creating activity',() => {
            this.activityResgistry.set(activity.id, activity)
            this.editMode = false;
            this.submitting = false;
            });
        } catch (error) {
            runInAction('creating activity error',() => {
                this.submitting = false;
            })
            
            console.log(error);

        }
    
    };

    @action editActivity = async (activity: IActivity) => {
        this.submitting = true;
        try {
            await agent.Activities.update(activity);
            runInAction('Edit activity',() => {
                this.activityResgistry.set(activity.id, activity);
                this.selectedActivity = activity;
                this.editMode = false;
                this.submitting = false;
            })
            
        } catch(error) {
            runInAction('Edit activity error',() => {
                this.submitting = false;
            })
            
            console.log(error);
        }
    };

    @action openCreateForm = () => {
        this.editMode = true;
        this.selectedActivity = undefined;
    };

    @action openEditForm = (id: string) => {
        this.selectedActivity = this.activityResgistry.get(id);
        this.editMode = true;
    };

    @action deleteActivity = async (event: SyntheticEvent<HTMLButtonElement>, id: string) => {
        this.submitting = true;
        this.target = event.currentTarget.name;
        try{
            await agent.Activities.delete(id);
            runInAction('delete activity',() => {
                this.activityResgistry.delete(id);
                this.submitting = false;
                this.target = '';
            })
            
        } catch (error){
            runInAction('deleting activity error',() => {
                this.submitting = false;
                this.target = '';
            })
            
            console.log(error);
        }
        
    };

    @action cancelSelectedActivity = () => {
        this.selectedActivity = undefined;
    };

    @action cancelFormopen = () => {
        this.editMode = false;
    };

    @action selectActivity =(id: string) => {
        this.selectedActivity = this.activityResgistry.get(id)
        this.editMode = false;
    };
}
 
export default createContext(new ActivityStore())