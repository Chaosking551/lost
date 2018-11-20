import { WizardTabView } from 'pipRoot/l3pfrontend/index'

class ConfigPipelineTab extends WizardTabView {
    constructor(){
        const config = {
            title: 'Enter Pipe Name and Description',
            icon: 'fa fa-list-alt',
            content: /*html*/`
                <div class='btn-toolbar toolbar' role='toolbar'>
                    <div class='btn-group pull-right' role='group'>
                        <button data-ref='btn-next' type='button' class='btn btn-sm btn-default'>
                            <i class='fa fa-step-forward'></i>  &nbsp;&nbsp;  
                            <span>Next<span> 
                        </button>
                    </div>
                    <div class='btn-group pull-right' role='group'>
                        <button data-ref='btn-prev' type='button' class='btn btn-sm btn-default '>
                            <i class='fa fa-step-backward'></i>   &nbsp;&nbsp;  
                            <span>Previous<span>    
                        </button>
                    </div>
                </div>
                <div>&nbsp</div>
                <label for='pipe_name'>Name * :</label>
                <input data-ref ='input-name' type='text' id='pipe_name' class='form-control' name='pipe_name' required=''>
                <label for='pipe_description'>Description * :</label>
                <input data-ref ='input-description' type='text' id='pipe_description' class='form-control' name='pipe_description' data-parsley-trigger='change' required=''>
                <div class='ln_solid'></div>
            `,
        }
        super(config)
    }
}
export default new ConfigPipelineTab()